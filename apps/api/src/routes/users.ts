import { Router } from 'express';
import { supabase } from '../config/supabase';

const router = Router();

// Get user by username
router.get('/:username', async (req, res) => {
  try {
    const { username } = req.params;

    const { data: user, error } = await supabase
      .from('users')
      .select('id, username, wallet_address, created_at')
      .eq('username', username)
      .single();

    if (error || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Check username availability
router.get('/check/:username', async (req, res) => {
  try {
    const { username } = req.params;

    const { data, error } = await supabase
      .from('users')
      .select('username')
      .eq('username', username)
      .single();

    res.json({ available: !data });
  } catch (error) {
    res.json({ available: true });
  }
});

// Update username
router.put('/:walletAddress/username', async (req, res) => {
  try {
    const { walletAddress } = req.params;
    const { username } = req.body;

    if (!username || username.length < 3 || username.length > 32) {
      return res.status(400).json({ error: 'Invalid username' });
    }

    // Check availability
    const { data: existing } = await supabase
      .from('users')
      .select('username')
      .eq('username', username)
      .single();

    if (existing) {
      return res.status(409).json({ error: 'Username already taken' });
    }

    const { data: user, error } = await supabase
      .from('users')
      .update({ username })
      .eq('wallet_address', walletAddress)
      .select()
      .single();

    if (error) throw error;

    res.json({ user });
  } catch (error) {
    console.error('Update username error:', error);
    res.status(500).json({ error: 'Failed to update username' });
  }
});

export default router;
