import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useAuthStore } from '../../stores/authStore';
import { useWalletStore } from '../../stores/walletStore';

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();
  const { disconnect } = useWalletStore();

  const handleLogout = async () => {
    await logout();
    disconnect();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>

      {user && (
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user.username[0].toUpperCase()}
            </Text>
          </View>
          <Text style={styles.username}>@{user.username}</Text>
          <Text style={styles.wallet}>
            {user.walletAddress.slice(0, 4)}...
            {user.walletAddress.slice(-4)}
          </Text>
        </View>
      )}

      <View style={styles.section}>
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuText}>Edit Username</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuText}>Settings</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
          <Text style={[styles.menuText, styles.logoutText]}>Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 60,
    marginBottom: 24,
  },
  profileCard: {
    backgroundColor: '#2d2d44',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#8b5cf6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  username: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  wallet: {
    fontSize: 14,
    color: '#aaa',
  },
  section: {
    backgroundColor: '#2d2d44',
    borderRadius: 16,
    overflow: 'hidden',
  },
  menuItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a2e',
  },
  menuText: {
    color: '#fff',
    fontSize: 16,
  },
  logoutText: {
    color: '#ef4444',
  },
});
