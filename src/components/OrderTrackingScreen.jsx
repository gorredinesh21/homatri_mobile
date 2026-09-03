import React, { useEffect, useState } from "react";
import { Modal, View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from "react-native";
import { fetchOrderDetail } from "../services/api";
import { colors, fonts, formatINR } from "../theme";
import { StatusChip, PaymentChip } from "./OrdersScreen";

const PIPELINE = ["PENDING_PAYMENT", "CONFIRMED", "BATCHED", "COOKING", "PACKED", "PICKED_UP", "DELIVERED"];
const STEP_LABELS = {
  PENDING_PAYMENT: "Payment Pending",
  CONFIRMED: "Order Confirmed",
  BATCHED: "Batched with Neighbours",
  COOKING: "Cooking in Kitchen",
  PACKED: "Packed",
  PICKED_UP: "Out for Delivery",
  DELIVERED: "Delivered",
};

export default function OrderTrackingScreen({ visible, order, token, onClose }) {
  const [live, setLive] = useState(order);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLive(order);
    setError(null);
  }, [order]);

  useEffect(() => {
    if (!visible || !order?.order_id || !token) return;
    let cancelled = false;
    const poll = async () => {
      try {
        const detail = await fetchOrderDetail(order.order_id, token);
        if (!cancelled) {
          setLive(detail);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) setError(e.message);
      }
    };
    poll();
    const interval = setInterval(poll, 8000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [visible, order?.order_id, token]);

  if (!live) return null;
  const currentStep = PIPELINE.indexOf(live.order_status);
  const paymentSkipped = live.payment_method === "COD" && live.order_status !== "PENDING_PAYMENT";

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.page}>
        <View style={styles.head}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.close}>✕ Close</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Order #{String(live.order_id).slice(0, 8)}</Text>
          <View style={{ width: 60 }} />
        </View>
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
          <View style={styles.card}>
            <View style={styles.cardHead}>
              <StatusChip status={live.order_status} />
              <Text style={styles.total}>{formatINR(live.total_amount)}</Text>
            </View>
            <View style={{ marginTop: 10 }}>
              <PaymentChip order={live} />
            </View>
            <Text style={styles.methodText}>
              {live.payment_method === "COD" ? "💵 Cash on Delivery" : "🔒 Paid Online"} · {live.payment_status}
            </Text>
          </View>

          <Text style={styles.pipelineHeader}>Live Tracking</Text>
          <Text style={styles.pipelineSub}>Auto-refreshes every 8 seconds{error ? ` · ${error}` : ""}</Text>

          <View style={styles.card, { marginTop: 12 }}>
            {PIPELINE.map((step, index) => {
              const done = paymentSkipped && step === "PENDING_PAYMENT";
              const reached = currentStep >= index || done;
              return (
                <View key={step} style={styles.stepRow}>
                  <View style={styles.stepRail}>
                    <View style={[styles.stepDot, reached && styles.stepDotDone]} />
                    {index < PIPELINE.length - 1 ? <View style={[styles.stepLine, currentStep > index && styles.stepLineDone]} /> : null}
                  </View>
                  <Text style={[styles.stepLabel, reached ? styles.stepLabelDone : null]}>
                    {done ? "Payment (COD)" : STEP_LABELS[step]}
                  </Text>
                </View>
              );
            })}
            {live.order_status === "PENDING_PAYMENT" ? (
              <Text style={styles.pendingNote}>Complete payment to confirm this order.</Text>
            ) : null}
          </View>

          {Array.isArray(live.items) && live.items.length ? (
            <View style={[styles.card, { marginTop: 12 }]}>
              <Text style={styles.itemsHeader}>Items</Text>
              {live.items.map((it, i) => (
                <View key={i} style={styles.itemRow}>
                  <Text style={styles.itemName}>{it.item_name || it.name || `Item ${it.menu_item_id}`}</Text>
                  <Text style={styles.itemQty}>×{it.quantity ?? 1}</Text>
                </View>
              ))}
            </View>
          ) : null}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.cream, paddingTop: 40 },
  head: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingBottom: 12, backgroundColor: colors.white, borderBottomWidth: 1, borderColor: colors.border },
  close: { color: colors.orange, fontWeight: "bold" },
  title: { fontSize: 16, fontWeight: "bold", color: colors.dark, fontFamily: fonts.heading },
  card: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: 18, padding: 16 },
  cardHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  total: { fontSize: 16, fontWeight: "bold", color: colors.orange },
  methodText: { fontSize: 12, color: colors.muted, marginTop: 8 },
  pipelineHeader: { fontSize: 18, fontWeight: "bold", color: colors.dark, marginTop: 20, fontFamily: fonts.heading },
  pipelineSub: { fontSize: 11, color: colors.muted, marginTop: 4 },
  stepRow: { flexDirection: "row", alignItems: "center" },
  stepRail: { width: 24, alignItems: "center", alignSelf: "stretch" },
  stepDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.border },
  stepDotDone: { backgroundColor: colors.green },
  stepLine: { flex: 1, width: 2, backgroundColor: colors.border },
  stepLineDone: { backgroundColor: colors.green },
  stepLabel: { flex: 1, fontSize: 13, color: colors.muted, paddingVertical: 12 },
  stepLabelDone: { color: colors.dark, fontWeight: "bold" },
  pendingNote: { fontSize: 12, color: colors.orange, marginTop: 10, fontWeight: "600" },
  itemsHeader: { fontSize: 14, fontWeight: "bold", color: colors.dark, marginBottom: 8 },
  itemRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4 },
  itemName: { fontSize: 13, color: colors.dark, flex: 1 },
  itemQty: { fontSize: 13, color: colors.muted },
});
