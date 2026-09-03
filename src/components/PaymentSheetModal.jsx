import React, { useState } from "react";
import { Modal, View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { colors, fonts, formatINR } from "../theme";

export default function PaymentSheetModal({ visible, order, orderTotal, onPay, onClose }) {
  const [paying, setPaying] = useState(false);

  const pay = async () => {
    setPaying(true);
    try {
      await onPay();
    } finally {
      setPaying(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <Text style={styles.title}>🔒 Pay Online</Text>
          <Text style={styles.sub}>Order {order?.order_id} is held for payment.</Text>

          <View style={styles.tokenCard}>
            <Text style={styles.tokenLabel}>TEST MODE</Text>
            <Text style={styles.tokenAmount}>{formatINR(order?.payment?.amount_rupees ?? 1)}</Text>
            <Text style={styles.tokenNote}>
              Razorpay test payment — only a {formatINR(1)} token is charged now. Full order total{" "}
              {formatINR(order?.payment?.order_total_rupees ?? orderTotal)} is settled on delivery.
            </Text>
          </View>

          <TouchableOpacity style={styles.payBtn} onPress={pay} disabled={paying}>
            {paying ? <ActivityIndicator color={colors.white} /> : <Text style={styles.payBtnText}>Pay {formatINR(1)} & Confirm Order</Text>}
          </TouchableOpacity>
          <TouchableOpacity onPress={onClose} disabled={paying}>
            <Text style={styles.cancel}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "flex-end" },
  sheet: { backgroundColor: colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 22 },
  title: { fontSize: 18, fontWeight: "bold", color: colors.dark, fontFamily: fonts.heading },
  sub: { fontSize: 13, color: colors.muted, marginTop: 4 },
  tokenCard: { marginTop: 16, backgroundColor: colors.greenLight, borderWidth: 1, borderColor: colors.green, borderRadius: 18, padding: 18, alignItems: "center" },
  tokenLabel: { fontSize: 10, fontWeight: "bold", color: colors.green, letterSpacing: 1 },
  tokenAmount: { fontSize: 34, fontWeight: "bold", color: colors.green, marginTop: 8, fontFamily: fonts.heading },
  tokenNote: { fontSize: 12, color: colors.dark, marginTop: 8, textAlign: "center", lineHeight: 18 },
  payBtn: { backgroundColor: colors.green, paddingVertical: 16, borderRadius: 18, alignItems: "center", marginTop: 18 },
  payBtnText: { color: colors.white, fontWeight: "bold" },
  cancel: { textAlign: "center", marginTop: 14, color: colors.muted, fontWeight: "600" },
});
