import React, { useEffect, useMemo, useState } from "react";
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
import { fetchReelComments, postReelComment } from "../services/api";
import { fonts } from "../theme";

export default function CommentSheet({
  visible,
  reel,
  userPhone,
  username,
  onClose,
  onMessageUser,
}) {
  const [comments, setComments] = useState([]);
  const [draft, setDraft] = useState("");
  const [replyingTo, setReplyingTo] = useState(null);

  useEffect(() => {
    if (!visible || !reel?.reel_id) return;
    fetchReelComments(reel.reel_id).then(setComments).catch(() => setComments([]));
  }, [visible, reel?.reel_id]);

  const parents = useMemo(() => comments.filter((c) => !c.parent_comment_id), [comments]);
  const childrenOf = (id) => comments.filter((c) => c.parent_comment_id === id);

  const submit = async () => {
    const text = draft.trim();
    if (!text) return;
    if (!userPhone) {
      Alert.alert("Sign in", "Sign in to comment on community reels.");
      return;
    }
    try {
      const result = await postReelComment({
        reel_id: reel.reel_id,
        user_phone: userPhone,
        username: username || "foodie",
        text,
        parent_comment_id: replyingTo?.comment_id || null,
      });
      setComments((prev) => [...prev, result.comment]);
      setDraft("");
      setReplyingTo(null);
    } catch (error) {
      Alert.alert("Comment", error.message || "Could not post comment.");
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.head}>
            <Text style={styles.title}>Comments</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.close}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={{ maxHeight: 360 }}>
            {parents.length === 0 ? (
              <Text style={styles.empty}>Be the first to comment on this kitchen short.</Text>
            ) : (
              parents.map((parent) => (
                <View key={parent.comment_id} style={{ marginBottom: 12 }}>
                  <View style={styles.commentRow}>
                    <TouchableOpacity onPress={() => onMessageUser?.(parent)}>
                      <Text style={styles.username}>@{parent.username}</Text>
                    </TouchableOpacity>
                    <Text style={styles.body}>{parent.text}</Text>
                    <TouchableOpacity onPress={() => setReplyingTo(parent)}>
                      <Text style={styles.reply}>Reply</Text>
                    </TouchableOpacity>
                  </View>
                  {childrenOf(parent.comment_id).map((child) => (
                    <View key={child.comment_id} style={styles.child}>
                      <TouchableOpacity onPress={() => onMessageUser?.(child)}>
                        <Text style={styles.username}>@{child.username}</Text>
                      </TouchableOpacity>
                      <Text style={styles.body}>{child.text}</Text>
                    </View>
                  ))}
                </View>
              ))
            )}
          </ScrollView>
          {replyingTo ? (
            <TouchableOpacity onPress={() => setReplyingTo(null)}>
              <Text style={styles.replying}>Replying to @{replyingTo.username}  · tap to cancel</Text>
            </TouchableOpacity>
          ) : null}
          <View style={styles.composer}>
            <TextInput
              value={draft}
              onChangeText={setDraft}
              placeholder={replyingTo ? `Reply to @${replyingTo.username}` : "Add a comment…"}
              style={styles.input}
            />
            <TouchableOpacity style={styles.send} onPress={submit}>
              <Text style={styles.sendText}>Post</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
  sheet: { backgroundColor: "#FFFFFF", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 18 },
  head: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  title: { fontSize: 16, fontWeight: "bold", color: "#1E293B", fontFamily: fonts.heading },
  close: { fontSize: 18, fontWeight: "bold" },
  empty: { color: "#64748B", fontSize: 13, paddingVertical: 20 },
  commentRow: { paddingVertical: 4 },
  username: { fontSize: 12, fontWeight: "bold", color: "#E53A00" },
  body: { fontSize: 13, color: "#1E293B", marginTop: 2 },
  reply: { fontSize: 11, fontWeight: "bold", color: "#64748B", marginTop: 4 },
  child: { marginLeft: 24, marginTop: 8, paddingLeft: 10, borderLeftWidth: 2, borderLeftColor: "#FFF1EC" },
  replying: { fontSize: 11, color: "#E53A00", marginBottom: 8 },
  composer: { flexDirection: "row", gap: 8, marginTop: 8 },
  input: { flex: 1, borderWidth: 1, borderColor: "#E2E8F0", borderRadius: 14, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: "#FBF9F6" },
  send: { backgroundColor: "#E53A00", borderRadius: 14, paddingHorizontal: 14, justifyContent: "center" },
  sendText: { color: "#FFFFFF", fontWeight: "bold" },
});
