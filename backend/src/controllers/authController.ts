import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { supabase } from "../config/supabase";
import { generateToken } from "../middleware/auth";
import { LoginRequest, RegisterRequest, AuthResponse } from "../types";
import crypto from "crypto";
import config from "../config";
import { RefreshTokenStore } from "../lib/refreshTokenStore";

const REFRESH_TOKEN_EXPIRY_DAYS =
  parseInt(String((config as any)?.cookie?.maxAgeDays || 7), 10) || 7; // days

async function createAndSetRefreshToken(
  userId: string,
  res: Response,
  ip?: string,
  userAgent?: string
) {
  const refreshToken = crypto.randomBytes(48).toString("hex");
  const expiresAt = new Date(
    Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000
  ).toISOString();

  // persist in DB with metadata
  await RefreshTokenStore.save({
    user_id: userId,
    token: refreshToken,
    expires_at: expiresAt,
    ip_address: ip ?? null,
    user_agent: userAgent ?? null,
  });

  // set HttpOnly cookie with env-aware options
  const cookieName =
    (config as any)?.cookie?.refreshTokenName || "refreshToken";
  const cookieSecure = Boolean((config as any)?.cookie?.secure);
  const cookieSameSite = ((config as any)?.cookie?.sameSite as any) || "lax";
  const cookieDomain = ((config as any)?.cookie?.domain as string) || undefined;
  const maxAge = REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000;

  const cookieOpts: any = {
    httpOnly: true,
    secure: cookieSecure,
    sameSite: cookieSameSite,
    maxAge,
    path: "/",
  };

  if (cookieDomain) cookieOpts.domain = cookieDomain;

  res.cookie(cookieName, refreshToken, cookieOpts);
  return refreshToken;
}

export class AuthController {
  // POST /auth/register
  static async register(
    req: Request<{}, AuthResponse, RegisterRequest>,
    res: Response<AuthResponse>
  ) {
    try {
      const { name, email, password } = req.body;

      // Verificar se o usuário já existe
      const { data: existingUser, error: searchError } = await supabase
        .from("users")
        .select("id")
        .eq("email", email)
        .single();

      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: "Email já está em uso",
        });
      }

      // Hash da senha
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Criar usuário
      const { data: newUser, error: createError } = await supabase
        .from("users")
        .insert([
          {
            name,
            email,
            password: hashedPassword,
          },
        ])
        .select("id, name, email")
        .single();

      if (createError) {
        console.error("Erro ao criar usuário:", createError);
        return res.status(500).json({
          success: false,
          message: "Erro interno do servidor ao criar usuário",
        });
      }

      // Gerar token JWT
      const token = generateToken({
        id: newUser.id.toString(),
        email: newUser.email,
        name: newUser.name,
      });

      // create refresh token and set cookie (capture metadata)
      await createAndSetRefreshToken(
        newUser.id.toString(),
        res,
        req.ip,
        req.get("User-Agent") || undefined
      );

      res.status(201).json({
        success: true,
        message: "Usuário criado com sucesso",
        user: newUser,
        token,
      });
    } catch (error) {
      console.error("Erro no registro:", error);
      res.status(500).json({
        success: false,
        message: "Erro interno do servidor",
      });
    }
  }

  // POST /auth/login
  static async login(
    req: Request<{}, AuthResponse, LoginRequest>,
    res: Response<AuthResponse>
  ) {
    try {
      const { email, password } = req.body;

      // Buscar usuário por email
      const { data: user, error: searchError } = await supabase
        .from("users")
        .select("id, name, email, password")
        .eq("email", email)
        .single();

      if (searchError || !user) {
        return res.status(401).json({
          success: false,
          message: "Email ou senha incorretos",
        });
      }

      // Verificar senha
      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: "Email ou senha incorretos",
        });
      }

      // Gerar token JWT
      const token = generateToken({
        id: user.id.toString(),
        email: user.email,
        name: user.name,
      });

      // create refresh token and set cookie (capture metadata)
      await createAndSetRefreshToken(
        user.id.toString(),
        res,
        req.ip,
        req.get("User-Agent") || undefined
      );

      // Remover senha da resposta
      const { password: _, ...userWithoutPassword } = user;

      res.json({
        success: true,
        message: "Login realizado com sucesso",
        user: userWithoutPassword,
        token,
      });
    } catch (error) {
      console.error("Erro no login:", error);
      res.status(500).json({
        success: false,
        message: "Erro interno do servidor",
      });
    }
  }

  // GET /auth/me
  static async getProfile(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Usuário não autenticado",
        });
      }

      // Buscar dados atualizados do usuário
      const { data: user, error } = await supabase
        .from("users")
        .select("id, name, email")
        .eq("id", req.user.id)
        .single();

      if (error || !user) {
        return res.status(404).json({
          success: false,
          message: "Usuário não encontrado",
        });
      }

      res.json({
        success: true,
        message: "Perfil obtido com sucesso",
        user,
      });
    } catch (error) {
      console.error("Erro ao obter perfil:", error);
      res.status(500).json({
        success: false,
        message: "Erro interno do servidor",
      });
    }
  }

  // POST /auth/refresh
  static async refresh(req: Request, res: Response) {
    try {
      const cookieName =
        (config as any)?.cookie?.refreshTokenName || "refreshToken";
      const refreshToken = (req.cookies as any)?.[cookieName] as
        | string
        | undefined;
      if (!refreshToken) {
        return res
          .status(401)
          .json({ success: false, message: "Refresh token missing" });
      }

      // lookup
      const data = await RefreshTokenStore.findByToken(refreshToken);

      if (!data) {
        return res
          .status(401)
          .json({ success: false, message: "Invalid refresh token" });
      }

      const expiresAt = new Date(data.expires_at);
      if (expiresAt < new Date()) {
        // expired
        await RefreshTokenStore.deleteById(data.id);
        return res
          .status(401)
          .json({ success: false, message: "Refresh token expired" });
      }

      // Load user
      const { data: user, error: userErr } = await supabase
        .from("users")
        .select("id, name, email")
        .eq("id", data.user_id)
        .single();

      if (userErr || !user) {
        return res
          .status(404)
          .json({ success: false, message: "User not found" });
      }

      // Issue new access token
      const newAccessToken = generateToken({
        id: user.id.toString(),
        email: user.email,
        name: user.name,
      });

      // Rotate refresh token: delete old and create new (capture metadata)
      await RefreshTokenStore.deleteById(data.id);
      await createAndSetRefreshToken(
        user.id.toString(),
        res,
        req.ip,
        req.get("User-Agent") || undefined
      );

      res.json({ success: true, token: newAccessToken });
    } catch (err) {
      console.error("refresh error", err);
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  }

  // POST /auth/logout
  static async logout(req: Request, res: Response) {
    try {
      const cookieName =
        (config as any)?.cookie?.refreshTokenName || "refreshToken";
      const refreshToken = (req.cookies as any)?.[cookieName] as
        | string
        | undefined;
      if (refreshToken) {
        await RefreshTokenStore.deleteByToken(refreshToken);
      }

      // Clear cookie with same options
      const cookieDomain =
        ((config as any)?.cookie?.domain as string) || undefined;
      const cookieSecure = Boolean((config as any)?.cookie?.secure);
      const cookieSameSite =
        ((config as any)?.cookie?.sameSite as any) || "lax";
      const clearOpts: any = {
        path: "/",
        httpOnly: true,
        secure: cookieSecure,
        sameSite: cookieSameSite,
      };
      if (cookieDomain) clearOpts.domain = cookieDomain;
      res.clearCookie(cookieName, clearOpts);
      return res.json({ success: true, message: "Logged out" });
    } catch (err) {
      console.error("logout error", err);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  }

  // GET /auth/refresh-tokens - list tokens for authenticated user
  static async listTokens(req: Request, res: Response) {
    try {
      if (!req.user)
        return res
          .status(401)
          .json({ success: false, message: "Unauthorized" });
      const data = await RefreshTokenStore.listByUser(req.user.id);
      return res.json({ success: true, data });
    } catch (err) {
      console.error("listTokens error", err);
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  }

  // DELETE /auth/refresh-tokens/:id - revoke a token (must belong to user)
  static async revokeToken(req: Request, res: Response) {
    try {
      if (!req.user)
        return res
          .status(401)
          .json({ success: false, message: "Unauthorized" });
      const id = req.params.id;

      // verify ownership
      const data = await RefreshTokenStore.getById(id);

      if (!data)
        return res
          .status(404)
          .json({ success: false, message: "Token not found" });

      if (String(data.user_id) !== String(req.user.id)) {
        return res.status(403).json({ success: false, message: "Forbidden" });
      }

      await RefreshTokenStore.deleteById(id);
      return res.json({ success: true, message: "Token revoked" });
    } catch (err) {
      console.error("revokeToken error", err);
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  }
}
