import { View, Text, StyleSheet, FlatList } from 'react-native';

export default function PaymentsScreen() {
  const payments = [];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Payment History</Text>

      {payments.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No payments yet</Text>
        </View>
      ) : (
        <FlatList
          data={payments}
          keyExtractor={(item: any) => item.id}
          renderItem={({ item }) => (
            <View style={styles.paymentItem}>
              <Text style={styles.paymentAmount}>${item.amount}</Text>
              <Text style={styles.paymentStatus}>{item.status}</Text>
            </View>
          )}
        />
      )}
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
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: '#aaa',
    fontSize: 16,
  },
  paymentItem: {
    backgroundColor: '#2d2d44',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paymentAmount: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  paymentStatus: {
    color: '#8b5cf6',
    fontSize: 14,
  },
});
