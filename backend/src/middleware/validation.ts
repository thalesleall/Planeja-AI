import { body, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

// Middleware para verificar resultados da validação
export const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Dados inválidos',
      errors: errors.array()
    });
  }
  next();
};

// Validações para registro
export const validateRegister = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Nome deve ter entre 2 e 50 caracteres'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email inválido'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Senha deve ter pelo menos 6 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Senha deve conter pelo menos uma letra minúscula, uma maiúscula e um número'),
  handleValidationErrors
];

// Validações para login
export const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email inválido'),
  body('password')
    .notEmpty()
    .withMessage('Senha é obrigatória'),
  handleValidationErrors
];

// Validações para criar tarefa
export const validateCreateTask = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Nome é obrigatório e deve ter no máximo 200 caracteres'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Descrição deve ter no máximo 1000 caracteres'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high'])
    .withMessage('Prioridade deve ser: low, medium ou high'),
  body('due_date')
    .optional()
    .isISO8601()
    .withMessage('Data de vencimento deve estar no formato ISO 8601'),
  handleValidationErrors
];

// Validações para criar lista
export const validateCreateList = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Nome é obrigatório e deve ter no máximo 200 caracteres'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Descrição deve ter no máximo 1000 caracteres'),
  handleValidationErrors
];

// Validações para criar tarefa
export const validateCreateItem = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Nome é obrigatório e deve ter no máximo 200 caracteres'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Descrição deve ter no máximo 1000 caracteres'),
  handleValidationErrors
];