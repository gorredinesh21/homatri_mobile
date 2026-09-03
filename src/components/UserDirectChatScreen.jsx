import React, { useEffect, useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { canMessageUser, fetchChatInbox, fetchChatThread, sendUserMessage } from "../services/api";
import { fonts } from "../theme";

const CHEF_NOTICE =
  "To protect kitchen cooking quality, chefs cannot be direct-messaged. Please comment on their reels or order their tiffin!";

export default function UserDirectChatScreen({
  visible,
  userPhone,
  initialPeer,
  onClose,
}) {
  const [inbox, setInbox] = useState([]);
  const [peer, setPeer] = useState(initialPeer);
  const [blocked, setBlocked] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [lookupPhone, setLookupPhone] = useState("");

  useEffect(() => {
    if (visible) {
      setPeer(initialPeer || null);
      if (userPhone) fetchChatInbox(userPhone).then(setInbox).catch(() => setInbox([]));
    }
  }, [visible, initialPeer, userPhone]);

  useEffect(() => {
    if (!visible || !peer?.phone || !userPhone) return;
    let cancelled = false;
    (async () => {
      const gate = await canMessageUser(peer.phone);
      if (cancelled) return;
      if (!gate.allowed) {
        setBlocked(gate.detail || CHEF_NOTICE);
        setMessages([]);
        return;
      }
      setBlocked(null);
      const rows = await fetchChatThread(userPhone, peer.phone);
      if (!cancelled) setMessages(rows);
    })().catch((error) => {
      setBlocked(error.message || CHEF_NOTICE);
    });
    return () => {
      cancelled = true;
    };
  }, [visible, peer?.phone, userPhone]);

  const startChat = async (phone, username) => {
    const digits = (phone || "").replace(/\D/g, "").slice(-10);
    if (digits.length !== 10) {
      Alert.alert("Chat", "Enter a 10-digit foodie phone number.");
      return;
    }
    const gate = await canMessageUser(digits);
    if (!gate.allowed) {
      Alert.alert("Chef privacy", gate.detail || CHEF_NOTICE);
      return;
    }
    setPeer({ phone: digits, username: username || digits });
  };

  const send = async () => {
    const text = draft.trim();
    if (!text || !peer?.phone) return;
    try {
      const result = await sendUserMessage({
        sender_phone: userPhone,
        receiver_phone: peer.phone,
        message_text: text,
      });
      setMessages((prev) => [...prev, result.message]);
      setDraft("");
    } catch (error) {
      Alert.alert("Chef privacy", error.message || CHEF_NOTICE);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.page}>
        <View style={styles.head}>
          <TouchableOpacity onPress={() => (peer ? setPeer(null) : onClose())}>
            <Text style={styles.back}>{peer ? "← Inbox" : "✕ Close"}</Text>
          </TouchableOpacity>
          <Text style={styles.title}>{peer ? `@${peer.username || peer.phone}` : "Community Chat"}</Text>
        </View>
        {!peer ? (
          <ScrollView contentContainerStyle={{ padding: 16 }}>
            <Text style={styles.hint}>Message fellow foodies. Chefs stay focused on the kitchen — DMs to chefs are blocked.</Text>
            <View style={styles.composer}>
              <TextInput
                value={lookupPhone}
                onChangeText={setLookupPhone}
                placeholder="Foodie phone number"
                keyboardType="phone-pad"
                style={styles.input}
              />
              <TouchableOpacity style={styles.send} onPress={() => startChat(lookupPhone)}>
                <Text style={styles.sendText}>Open</Text>
              </TouchableOpacity>
            </View>
            {inbox.map((item) => (
              <TouchableOpacity
                key={item.peer_phone}
                style={styles.inboxRow}
                onPress={() => startChat(item.peer_phone, item.peer_username)}
              >
                <Text style={styles.inboxName}>@{item.peer_username || item.peer_name}</Text>
                <Text style={styles.inboxPreview} numberOfLines={1}>{item.last_message}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        ) : blocked ? (
          <View style={styles.blockCard}>
            <Text style={styles.blockTitle}>Chef privacy protection</Text>
            <Text style={styles.blockBody}>{blocked}</Text>
          </View>
        ) : (
          <>
            <ScrollView style={{ flex: 1, padding: 16 }}>
              {messages.map((msg) => {
                const mine = msg.sender_phone === userPhone;
                return (
                  <View key={msg.message_id} style={[styles.bubble, mine ? styles.mine : styles.theirs]}>
                    <Text style={[styles.bubbleText, mine && { color: "#FFFFFF" }]}>{msg.message_text}</Text>
                  </View>
                );
              })}
            </ScrollView>
            <View style={[styles.composer, { padding: 12 }]}>
              <TextInput value={draft} onChangeText={setDraft} placeholder="Message a foodie…" style={styles.input} />
              <TouchableOpacity style={styles.send} onPress={send}>
                <Text style={styles.sendText}>Send</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#FBF9F6", paddingTop: 40 },
  head: { paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, borderColor: "#E2E8F0", backgroundColor: "#FFFFFF" },
  back: { color: "#E53A00", fontWeight: "bold", marginBottom: 6 },
  title: { fontSize: 18, fontWeight: "bold", color: "#1E293B", fontFamily: fonts.heading },
  hint: { fontSize: 13, color: "#64748B", lineHeight: 18, marginBottom: 12 },
  composer: { flexDirection: "row", gap: 8, marginBottom: 12 },
  input: { flex: 1, borderWidth: 1, borderColor: "#E2E8F0", borderRadius: 14, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: "#FFFFFF" },
  send: { backgroundColor: "#E53A00", borderRadius: 14, paddingHorizontal: 14, justifyContent: "center" },
  sendText: { color: "#FFFFFF", fontWeight: "bold" },
  inboxRow: { backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E2E8F0", borderRadius: 16, padding: 14, marginBottom: 8 },
  inboxName: { fontWeight: "bold", color: "#1E293B", fontFamily: fonts.baseBold },
  inboxPreview: { color: "#64748B", marginTop: 4, fontSize: 12 },
  blockCard: { margin: 16, backgroundColor: "#FBF9F6", borderRadius: 18, padding: 18, borderWidth: 1, borderColor: "#FFF1EC" },
  blockTitle: { fontWeight: "bold", color: "#E53A00", fontSize: 16 },
  blockBody: { marginTop: 8, color: "#64748B", lineHeight: 20 },
  bubble: { maxWidth: "80%", padding: 10, borderRadius: 16, marginBottom: 8 },
  mine: { alignSelf: "flex-end", backgroundColor: "#E53A00" },
  theirs: { alignSelf: "flex-start", backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E2E8F0" },
  bubbleText: { color: "#1E293B", fontSize: 13 },
});
