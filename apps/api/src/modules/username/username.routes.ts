import { Router } from 'express';
import { UsernameService } from './username.service';
import { authMiddleware } from '../../middleware/auth';

const router = Router();
const usernameService = new UsernameService();

router.get('/check/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const available = await usernameService.checkAvailability(username);
    
    res.json({ available });
  } catch (error) {
    res.status(500).json({ error: 'Failed to check username' });
  }
});

router.post('/register', authMiddleware, async (req, res) => {
  try {
    const { username } = req.body;
    const { walletAddress, userId } = req.user;

    const registry = await usernameService.register(
      username,
      walletAddress,
      userId
    );

    res.json(registry);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/resolve/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const result = await usernameService.resolve(username);

    if (!result) {
      return res.status(404).json({ error: 'Username not found' });
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to resolve username' });
  }
});

export default router;
