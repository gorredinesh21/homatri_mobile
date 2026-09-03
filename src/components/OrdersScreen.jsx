import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, FlatList, StyleSheet, RefreshControl, ActivityIndicator } from "react-native";
import { fetchMyOrders } from "../services/api";
import { colors, fonts, formatINR } from "../theme";

const STATUS_LABELS = {
  PENDING_PAYMENT: { label: "Payment Pending", color: colors.orange, bg: colors.orangeLight },
  CONFIRMED: { label: "Confirmed", color: colors.green, bg: colors.greenLight },
  BATCHED: { label: "Batched", color: colors.dark, bg: colors.border },
  COOKING: { label: "Cooking", color: colors.orange, bg: colors.orangeLight },
  PACKED: { label: "Packed", color: colors.dark, bg: colors.border },
  PICKED_UP: { label: "Picked Up", color: colors.green, bg: colors.greenLight },
  DELIVERED: { label: "Delivered", color: colors.green, bg: colors.greenLight },
};

export function StatusChip({ status }) {
  const meta = STATUS_LABELS[status] || { label: status, color: colors.muted, bg: colors.border };
  return (
    <View style={[styles.chip, { backgroundColor: meta.bg }]}>
      <Text style={[styles.chipText, { color: meta.color }]}>{meta.label}</Text>
    </View>
  );
}

export function PaymentChip({ order }) {
  const method = order.payment_method || "COD";
  if (method === "COD") {
    const paid = order.payment_status === "PAID";
    return (
      <View style={[styles.chip, { backgroundColor: paid ? colors.greenLight : colors.orangeLight }]}>
        <Text style={[styles.chipText, { color: paid ? colors.green : colors.orange }]}>
          {paid ? "COD Paid" : `Pay ${formatINR(order.total_amount)} on delivery`}
        </Text>
      </View>
    );
  }
  const paid = order.payment_status === "PAID";
  return (
    <View style={[styles.chip, { backgroundColor: paid ? colors.greenLight : colors.orangeLight }]}>
      <Text style={[styles.chipText, { color: paid ? colors.green : colors.orange }]}>
        {paid ? "Paid Online" : "Payment Pending"}
      </Text>
    </View>
  );
}

export default function OrdersScreen({ token, onOpenOrder }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const rows = await fetchMyOrders(token);
      setOrders(Array.isArray(rows) ? rows : []);
    } catch {
      setOrders([]);
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await load();
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const refresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.orange} />
      </View>
    );
  }

  if (!orders.length) {
    return (
      <View style={[styles.center, { padding: 24 }]}>
        <Text style={styles.emptyEmoji}>📦</Text>
        <Text style={styles.emptyTitle}>No orders yet</Text>
        <Text style={styles.emptySub}>Your tiffin orders will appear here for live tracking.</Text>
      </View>
    );
  }

  return (
    <FlatList
      style={styles.list}
      contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
      data={orders}
      keyExtractor={(o) => String(o.order_id ?? o.id)}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.orange} />}
      renderItem={({ item }) => (
        <TouchableOpacity style={styles.card} onPress={() => onOpenOrder(item)}>
          <View style={styles.cardHead}>
            <Text style={styles.orderId}>#{String(item.order_id ?? item.id).slice(0, 8)}</Text>
            <StatusChip status={item.order_status} />
          </View>
          <View style={styles.cardBody}>
            <View style={{ flex: 1 }}>
              <PaymentChip order={item} />
            </View>
            <Text style={styles.total}>{formatINR(item.total_amount)}</Text>
          </View>
          <Text style={styles.trackHint}>Tap to track live ➔</Text>
        </TouchableOpacity>
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: { flex: 1, backgroundColor: colors.cream },
  center: { flex: 1, backgroundColor: colors.cream, alignItems: "center", justifyContent: "center" },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { fontSize: 16, fontWeight: "bold", color: colors.dark, marginTop: 12, fontFamily: fonts.heading },
  emptySub: { fontSize: 13, color: colors.muted, marginTop: 6, textAlign: "center" },
  card: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: 18, padding: 16, marginBottom: 12 },
  cardHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  orderId: { fontSize: 15, fontWeight: "bold", color: colors.dark },
  cardBody: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 10 },
  total: { fontSize: 16, fontWeight: "bold", color: colors.orange },
  trackHint: { fontSize: 11, color: colors.muted, marginTop: 10 },
  chip: { alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, overflow: "hidden" },
  chipText: { fontSize: 10, fontWeight: "bold" },
});
