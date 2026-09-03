import React, { useState } from "react";
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { generateSmartUsername, sanitizeUsername } from "../utils/username";
import { setupUsername } from "../services/api";
import { fonts } from "../theme";

export default function UsernameSetupModal({ visible, phone, fullName, onComplete }) {
  const [value, setValue] = useState("");
  const preview = value.trim() ? sanitizeUsername(value) : generateSmartUsername(fullName, phone);

  const finish = async (requested) => {
    try {
      const result = await setupUsername({ phone, requestedUsername: requested });
      onComplete(result.username);
    } catch (error) {
      Alert.alert("Username", error.message || "Could not save username.");
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <Text style={styles.title}>Pick a Homatri username</Text>
          <Text style={styles.sub}>This is how other foodies will find you in comments and community chat.</Text>
          <TextInput
            value={value}
            onChangeText={setValue}
            autoCapitalize="none"
            placeholder="e.g. dinesh_chandan"
            style={styles.input}
          />
          <Text style={styles.preview}>Preview: @{preview}</Text>
          <TouchableOpacity style={styles.primary} onPress={() => finish(sanitizeUsername(value) || null)}>
            <Text style={styles.primaryText}>{value.trim() ? "Save username" : "Use suggested username"}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => finish(null)}>
            <Text style={styles.skip}>Skip — auto-generate for me</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  sheet: { backgroundColor: "#FFFFFF", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 22 },
  title: { fontSize: 18, fontWeight: "bold", color: "#1E293B", fontFamily: fonts.heading },
  sub: { fontSize: 13, color: "#64748B", marginTop: 8, lineHeight: 18 },
  input: { borderWidth: 1, borderColor: "#E2E8F0", borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, marginTop: 14, backgroundColor: "#FBF9F6" },
  preview: { fontSize: 12, color: "#E53A00", fontWeight: "bold", marginTop: 8 },
  primary: { backgroundColor: "#E53A00", paddingVertical: 14, borderRadius: 16, alignItems: "center", marginTop: 16 },
  primaryText: { color: "#FFFFFF", fontWeight: "bold" },
  skip: { textAlign: "center", marginTop: 14, color: "#64748B", fontWeight: "600" },
});
