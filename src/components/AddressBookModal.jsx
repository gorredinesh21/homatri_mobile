import React, { useEffect, useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { saveCustomerAddress } from "../services/api";
import { colors, fonts } from "../theme";

const CLUSTERS = ["Ghansoli", "Vashi", "Airoli"];

export default function AddressBookModal({
  visible,
  addresses,
  selectedAddressId,
  onSelect,
  onRefresh,
  token,
  onClose,
}) {
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    flat_no: "",
    street_address: "",
    landmark: "",
    cluster: "Ghansoli",
    phone: "",
    latitude: "",
    longitude: "",
  });

  useEffect(() => {
    if (visible) setShowForm(false);
  }, [visible]);

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const submit = async () => {
    if (!form.flat_no || !form.street_address || !form.phone) {
      Alert.alert("Address", "Flat no, street address, and phone are required.");
      return;
    }
    setSaving(true);
    try {
      await saveCustomerAddress(
        {
          flat_no: form.flat_no,
          street_address: form.street_address,
          landmark: form.landmark || null,
          full_address: [form.flat_no, form.street_address, form.landmark, form.cluster].filter(Boolean).join(", "),
          phone: form.phone,
          cluster: form.cluster,
          latitude: form.latitude ? Number(form.latitude) : null,
          longitude: form.longitude ? Number(form.longitude) : null,
        },
        token
      );
      setForm({ flat_no: "", street_address: "", landmark: "", cluster: "Ghansoli", phone: "", latitude: "", longitude: "" });
      setShowForm(false);
      await onRefresh();
    } catch (e) {
      Alert.alert("Address", e.message || "Could not save address.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.page}>
        <View style={styles.head}>
          <Text style={styles.title}>Saved Addresses</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.close}>✕ Close</Text>
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
          {addresses.map((addr) => {
            const selected = addr.id === selectedAddressId;
            return (
              <TouchableOpacity
                key={addr.id}
                style={[styles.card, selected && styles.cardSelected]}
                onPress={() => onSelect(addr.id)}
              >
                <View style={styles.cardRow}>
                  <Text style={styles.cardIcon}>📍</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardText}>{addr.full_address || addr.fullAddress}</Text>
                    <Text style={styles.cardMeta}>{addr.cluster} · {addr.phone}</Text>
                  </View>
                  {selected ? <Text style={styles.selectedTag}>DEFAULT</Text> : null}
                </View>
              </TouchableOpacity>
            );
          })}
          {!addresses.length ? (
            <Text style={styles.empty}>No saved addresses yet. Add one below to enable checkout.</Text>
          ) : null}

          {!showForm ? (
            <TouchableOpacity style={styles.addBtn} onPress={() => setShowForm(true)}>
              <Text style={styles.addBtnText}>+ Add New Address</Text>
            </TouchableOpacity>
          ) : (
            <View style={{ gap: 10, marginTop: 16 }}>
              <TextInput value={form.flat_no} onChangeText={(v) => setField("flat_no", v)} placeholder="Flat / House No *" style={styles.input} />
              <TextInput value={form.street_address} onChangeText={(v) => setField("street_address", v)} placeholder="Street Address *" style={styles.input} />
              <TextInput value={form.landmark} onChangeText={(v) => setField("landmark", v)} placeholder="Landmark" style={styles.input} />
              <TextInput value={form.phone} onChangeText={(v) => setField("phone", v)} placeholder="Phone *" keyboardType="phone-pad" style={styles.input} />
              <View style={{ flexDirection: "row", gap: 8 }}>
                {CLUSTERS.map((c) => (
                  <TouchableOpacity
                    key={c}
                    style={[styles.clusterChip, form.cluster === c && styles.clusterChipActive]}
                    onPress={() => setField("cluster", c)}
                  >
                    <Text style={[styles.clusterText, form.cluster === c && styles.clusterTextActive]}>{c}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={{ flexDirection: "row", gap: 8 }}>
                <TextInput value={form.latitude} onChangeText={(v) => setField("latitude", v)} placeholder="Latitude" keyboardType="decimal-pad" style={[styles.input, { flex: 1 }]} />
                <TextInput value={form.longitude} onChangeText={(v) => setField("longitude", v)} placeholder="Longitude" keyboardType="decimal-pad" style={[styles.input, { flex: 1 }]} />
              </View>
              <TouchableOpacity style={styles.saveBtn} onPress={submit} disabled={saving}>
                {saving ? <ActivityIndicator color={colors.white} /> : <Text style={styles.saveBtnText}>Save Address</Text>}
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.cream, paddingTop: 40 },
  head: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingBottom: 12, backgroundColor: colors.white, borderBottomWidth: 1, borderColor: colors.border },
  title: { fontSize: 18, fontWeight: "bold", color: colors.dark, fontFamily: fonts.heading },
  close: { color: colors.orange, fontWeight: "bold" },
  card: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 14, marginBottom: 10 },
  cardSelected: { borderColor: colors.orange, backgroundColor: colors.orangeLight },
  cardRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  cardIcon: { fontSize: 18 },
  cardText: { fontSize: 13, fontWeight: "bold", color: colors.dark, flex: 1 },
  cardMeta: { fontSize: 11, color: colors.muted, marginTop: 4 },
  selectedTag: { fontSize: 9, fontWeight: "bold", color: colors.orange, backgroundColor: colors.white, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, overflow: "hidden" },
  empty: { color: colors.muted, fontSize: 13, paddingVertical: 16, textAlign: "center" },
  addBtn: { borderWidth: 1.5, borderColor: colors.orange, borderRadius: 16, paddingVertical: 14, alignItems: "center", marginTop: 8 },
  addBtnText: { color: colors.orange, fontWeight: "bold" },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10, fontSize: 13, backgroundColor: colors.white },
  clusterChip: { paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: colors.border, borderRadius: 12, backgroundColor: colors.white },
  clusterChipActive: { backgroundColor: colors.orange, borderColor: colors.orange },
  clusterText: { fontSize: 12, fontWeight: "bold", color: colors.muted },
  clusterTextActive: { color: colors.white },
  saveBtn: { backgroundColor: colors.orange, paddingVertical: 14, borderRadius: 16, alignItems: "center", marginTop: 4 },
  saveBtnText: { color: colors.white, fontWeight: "bold" },
});
