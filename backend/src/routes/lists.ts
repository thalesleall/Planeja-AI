import { Router } from 'express';
import { ListController } from '../controllers/listController';
import { validateCreateItem } from '../middleware/validation';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Aplicar autenticação a todas as rotas de listas
router.use(authenticateToken);

// GET /lists - Obter todas as listas do usuário
router.get('/', ListController.getAllLists);

// POST /lists - Criar nova lista
router.post('/', ListController.createList);

// GET /lists/:id - Obter lista específica com itens
router.get('/:id', ListController.getListById);

// DELETE /lists/:id - Deletar lista
router.delete('/:id', ListController.deleteList);

// POST /lists/:listId/items - Criar nova tarefa em uma lista específica
router.post('/:listId/items', validateCreateItem, ListController.createItemInList);

export default router;