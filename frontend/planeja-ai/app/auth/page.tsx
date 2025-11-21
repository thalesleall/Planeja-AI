"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import api from "@/lib/api";
import { setToken, setStoredUser } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface LoginData {
  email: string;
  password: string;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
}

type AuthResponsePayload = {
  token?: string;
  accessToken?: string;
  user?: Record<string, unknown>;
};

export default function AuthPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Estados para login
  const [loginData, setLoginData] = useState<LoginData>({
    email: "",
    password: "",
  });

  // Estados para cadastro
  const [registerData, setRegisterData] = useState<RegisterData>({
    name: "",
    email: "",
    password: "",
  });

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      const res = await api.auth.login(loginData);
      if (!res.ok) {
        const message = "Credenciais inválidas ou usuário não encontrado.";
        setError(message);
        toast.error(message);
        return;
      }
      const authPayload = res.data as AuthResponsePayload | undefined;
      const token = authPayload?.token ?? authPayload?.accessToken;
      const user = authPayload?.user;
      if (token) await setToken(token);
      if (user) setStoredUser(user);
      if (user && typeof user["id"] !== "undefined") {
        localStorage.setItem("userId", String(user["id"]));
      }
      toast.success("Bem-vindo de volta!");
      router.push("/");
    } catch (err) {
      console.error("Erro no login", err);
      const message = "Não foi possível entrar. Tente novamente.";
      setError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      const res = await api.auth.register(registerData);
      if (!res.ok) {
        const message =
          "Falha ao registrar. Verifique os dados e tente novamente.";
        setError(message);
        toast.error(message);
        return;
      }
      const authPayload = res.data as AuthResponsePayload | undefined;
      const token = authPayload?.token ?? authPayload?.accessToken;
      const user = authPayload?.user;
      if (token) await setToken(token);
      if (user) setStoredUser(user);
      if (user && typeof user["id"] !== "undefined") {
        localStorage.setItem("userId", String(user["id"]));
      }
      toast.success("Conta criada com sucesso!");
      router.push("/");
    } catch (err) {
      console.error("Erro no registro", err);
      const message = "Não foi possível criar a conta no momento.";
      setError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleMode = () => {
    setMode(mode === "login" ? "register" : "login");
    setError(null);
    setSubmitting(false);
    // Limpar os formulários ao alternar
    setLoginData({ email: "", password: "" });
    setRegisterData({ name: "", email: "", password: "" });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">
            {mode === "login" ? "Entrar" : "Criar conta"}
          </CardTitle>
          <CardDescription className="text-center">
            {mode === "login"
              ? "Entre com suas credenciais para acessar sua conta"
              : "Crie uma nova conta para começar"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 text-sm text-red-500 text-center">{error}</div>
          )}
          {mode === "login" ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email">Email</Label>
                <Input
                  id="login-email"
                  type="email"
                  placeholder="seu@email.com"
                  value={loginData.email}
                  onChange={(e) =>
                    setLoginData((prev) => ({ ...prev, email: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-password">Senha</Label>
                <Input
                  id="login-password"
                  type="password"
                  placeholder="Sua senha"
                  value={loginData.password}
                  onChange={(e) =>
                    setLoginData((prev) => ({
                      ...prev,
                      password: e.target.value,
                    }))
                  }
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? "Entrando..." : "Entrar"}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="register-name">Nome</Label>
                <Input
                  id="register-name"
                  type="text"
                  placeholder="Seu nome completo"
                  value={registerData.name}
                  onChange={(e) =>
                    setRegisterData((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="register-email">Email</Label>
                <Input
                  id="register-email"
                  type="email"
                  placeholder="seu@email.com"
                  value={registerData.email}
                  onChange={(e) =>
                    setRegisterData((prev) => ({
                      ...prev,
                      email: e.target.value,
                    }))
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="register-password">Senha</Label>
                <Input
                  id="register-password"
                  type="password"
                  placeholder="Crie uma senha"
                  value={registerData.password}
                  onChange={(e) =>
                    setRegisterData((prev) => ({
                      ...prev,
                      password: e.target.value,
                    }))
                  }
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? "Criando..." : "Criar conta"}
              </Button>
            </form>
          )}

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              {mode === "login" ? "Não tem uma conta?" : "Já tem uma conta?"}
            </p>
            <Button
              type="button"
              variant="link"
              onClick={toggleMode}
              className="mt-1 p-0 h-auto font-semibold"
            >
              {mode === "login" ? "Criar conta" : "Entrar"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
