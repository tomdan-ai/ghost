import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useWalletStore } from '../stores/walletStore';

export default function WalletButton() {
  const { connected, address, disconnect } = useWalletStore();

  const handlePress = () => {
    if (connected) {
      disconnect();
    } else {
      // Connect wallet logic
    }
  };

  return (
    <TouchableOpacity style={styles.button} onPress={handlePress}>
      <Text style={styles.text}>
        {connected
          ? `${address?.slice(0, 4)}...${address?.slice(-4)}`
          : 'Connect Wallet'}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#8b5cf6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  text: {
    color: '#fff',
    fontWeight: '600',
  },
});
