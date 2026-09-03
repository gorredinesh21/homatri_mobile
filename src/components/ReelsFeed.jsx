import React, { useEffect, useRef, useState } from "react";
import {
  FlatList,
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";
import { fetchReelsFeed } from "../services/api";
import { colors, fonts } from "../theme";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const REEL_HEIGHT = SCREEN_HEIGHT - 170;

export default function ReelsFeed({ likedReels, onToggleLike, onOpenComments, initialReelId }) {
  const [reels, setReels] = useState([]);
  const [failed, setFailed] = useState(false);
  const listRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    fetchReelsFeed()
      .then((rows) => {
        if (!cancelled) setReels(Array.isArray(rows) ? rows : []);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!initialReelId) return;
    const index = reels.findIndex((r) => r.reel_id === initialReelId);
    if (index >= 0) {
      setTimeout(() => listRef.current?.scrollToIndex({ index, animated: true }), 50);
    }
  }, [initialReelId, reels]);

  if (!reels.length) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyEmoji}>🎥</Text>
        <Text style={styles.emptyTitle}>{failed ? "Could not load reels" : "No community reels yet"}</Text>
        <Text style={styles.emptySub}>Kitchen shorts from Homatri chefs will appear here.</Text>
      </View>
    );
  }

  return (
    <FlatList
      ref={listRef}
      data={reels}
      keyExtractor={(item) => String(item.reel_id)}
      pagingEnabled
      snapToInterval={REEL_HEIGHT}
      decelerationRate="fast"
      showsVerticalScrollIndicator={false}
      getItemLayout={(_, index) => ({ length: REEL_HEIGHT, offset: REEL_HEIGHT * index, index })}
      renderItem={({ item }) => {
        const liked = Boolean(likedReels[item.reel_id]);
        return (
          <View style={styles.page}>
            <Image source={{ uri: item.thumbnail_url || item.video_url }} style={styles.media} />
            <View style={styles.caption}>
              <Text style={styles.chef}>👩‍🍳 {item.chef_name}</Text>
              <Text style={styles.text}>{item.caption || item.title}</Text>
            </View>
            <View style={styles.actions}>
              <TouchableOpacity style={styles.action} onPress={() => onToggleLike(item.reel_id)}>
                <Text style={styles.actionEmoji}>{liked ? "❤️" : "🤍"}</Text>
                <Text style={styles.actionCount}>{(item.likes_count || 0) + (liked ? 1 : 0)}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.action} onPress={() => onOpenComments(item)}>
                <Text style={styles.actionEmoji}>💬</Text>
                <Text style={styles.actionCount}>{item.comments_count || "Chat"}</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  page: { width: SCREEN_WIDTH, height: REEL_HEIGHT, backgroundColor: "#000000" },
  media: { width: "100%", height: "100%", opacity: 0.92 },
  caption: { position: "absolute", left: 16, bottom: 28, right: 88 },
  chef: { color: colors.white, fontWeight: "bold", fontSize: 14, fontFamily: fonts.baseBold },
  text: { color: colors.white, fontSize: 13, marginTop: 6, lineHeight: 18, fontFamily: fonts.base },
  actions: { position: "absolute", right: 12, bottom: 48, alignItems: "center", gap: 16 },
  action: { alignItems: "center" },
  actionEmoji: { fontSize: 26 },
  actionCount: { color: colors.white, fontSize: 11, fontWeight: "bold", marginTop: 4, fontFamily: fonts.baseBold },
  empty: { flex: 1, backgroundColor: colors.cream, alignItems: "center", justifyContent: "center", padding: 32 },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { fontSize: 16, fontWeight: "bold", color: colors.dark, marginTop: 12, fontFamily: fonts.baseBold },
  emptySub: { fontSize: 13, color: colors.muted, marginTop: 6, textAlign: "center", fontFamily: fonts.base },
});
