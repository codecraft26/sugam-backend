// Todo routes (for regular users only)
// Note: Authentication is already handled by the parent auth routes
import { Router } from 'express';
import { TodoController } from './todo.controller';

const router = Router();
const todoController = new TodoController();

// Todo management endpoints
router.post('/', todoController.createTodo.bind(todoController));
router.get('/', todoController.getTodos.bind(todoController));
router.get('/:id', todoController.getTodoById.bind(todoController));
router.put('/:id', todoController.updateTodo.bind(todoController));
router.delete('/:id', todoController.deleteTodo.bind(todoController));

export default router;

