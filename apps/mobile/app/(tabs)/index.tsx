import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useWalletStore } from '../../stores/walletStore';
import { useAuthStore } from '../../stores/authStore';

export default function HomeScreen() {
  const { address, balance, connected } = useWalletStore();
  const { user } = useAuthStore();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Ghost Wallet</Text>
        {user && (
          <Text style={styles.username}>@{user.username}</Text>
        )}
      </View>

      {connected ? (
        <View style={styles.walletInfo}>
          <Text style={styles.balanceLabel}>Balance</Text>
          <Text style={styles.balance}>${balance} USDC</Text>
          <Text style={styles.address}>
            {address?.slice(0, 4)}...{address?.slice(-4)}
          </Text>
        </View>
      ) : (
        <TouchableOpacity style={styles.connectButton}>
          <Text style={styles.connectButtonText}>Connect Wallet</Text>
        </TouchableOpacity>
      )}

      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionButtonText}>Receive</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionButtonText}>Send</Text>
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
  header: {
    marginTop: 60,
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  username: {
    fontSize: 18,
    color: '#8b5cf6',
    marginTop: 8,
  },
  walletInfo: {
    backgroundColor: '#2d2d44',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
  },
  balanceLabel: {
    fontSize: 14,
    color: '#aaa',
    marginBottom: 8,
  },
  balance: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  address: {
    fontSize: 14,
    color: '#8b5cf6',
  },
  connectButton: {
    backgroundColor: '#8b5cf6',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  connectButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#2d2d44',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
