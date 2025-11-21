import { body, validationResult } from "express-validator";
import { Request, Response, NextFunction } from "express";

// Middleware para verificar resultados da validação
export const handleValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Dados inválidos",
      errors: errors.array(),
    });
  }
  next();
};

// Validações para registro
export const validateRegister = [
  body("name")
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Nome deve ter entre 2 e 50 caracteres"),
  body("email").isEmail().normalizeEmail().withMessage("Email inválido"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Senha deve ter pelo menos 6 caracteres")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(
      "Senha deve conter pelo menos uma letra minúscula, uma maiúscula e um número"
    ),
  handleValidationErrors,
];

// Validações para login
export const validateLogin = [
  body("email").isEmail().normalizeEmail().withMessage("Email inválido"),
  body("password").notEmpty().withMessage("Senha é obrigatória"),
  handleValidationErrors,
];

// Validações para criar tarefa
export const validateCreateTask = [
  body("name")
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage("Nome é obrigatório e deve ter no máximo 200 caracteres"),
  body("description")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Descrição deve ter no máximo 1000 caracteres"),
  body("priority")
    .optional()
    .isIn(["low", "medium", "high"])
    .withMessage("Prioridade deve ser: low, medium ou high"),
  body("due_date")
    .optional()
    .isISO8601()
    .withMessage("Data de vencimento deve estar no formato ISO 8601"),
  handleValidationErrors,
];

export const validateUpdateTask = [
  body("name")
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage("Nome deve ter entre 1 e 200 caracteres"),
  body("description")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Descrição deve ter no máximo 1000 caracteres"),
  body("done").optional().isBoolean().withMessage("done precisa ser booleano"),
  body("priority")
    .optional()
    .isIn(["low", "medium", "high"])
    .withMessage("Prioridade inválida"),
  body("due_date").optional().isISO8601().withMessage("Data inválida"),
  handleValidationErrors,
];

// Validações para criar lista
export const validateCreateList = [
  body("name")
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage("Nome é obrigatório e deve ter no máximo 200 caracteres"),
  body("description")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Descrição deve ter no máximo 1000 caracteres"),
  handleValidationErrors,
];

// Validações para criar tarefa
export const validateCreateItem = [
  body("name")
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage("Nome é obrigatório e deve ter no máximo 200 caracteres"),
  body("description")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Descrição deve ter no máximo 1000 caracteres"),
  handleValidationErrors,
];

// Basic prompt validation middleware for chat messages.
export const validatePrompt = [
  body("message")
    .isString()
    .isLength({ min: 1, max: 5000 })
    .withMessage(
      "Message must be a non-empty string and under 5000 characters"
    ),
  body("message").custom((value) => {
    const forbidden = [
      "<script>",
      "DROP TABLE",
      "DELETE FROM",
      "rm -rf",
      "passwd",
    ];
    const lower = String(value).toLowerCase();
    for (const f of forbidden) {
      if (lower.includes(f.toLowerCase()))
        throw new Error("Message contains forbidden content");
    }
    return true;
  }),
  handleValidationErrors,
];
