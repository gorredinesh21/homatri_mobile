import React from "react";
import { ScrollView, View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import { fonts } from "../theme";

export default function ChefVideoGallery({ videos = [], onOpenReel }) {
  if (!videos.length) return null;
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>Kitchen shorts</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
        {videos.map((video) => (
          <TouchableOpacity key={video.reel_id || video.id} style={styles.card} onPress={() => onOpenReel?.(video)}>
            <Image source={{ uri: video.thumbnail_url || video.video_url }} style={styles.thumb} />
            <View style={styles.play}>
              <Text style={styles.playText}>▶</Text>
            </View>
            <Text numberOfLines={2} style={styles.caption}>
              {video.title || video.caption}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 14 },
  label: { fontSize: 13, fontWeight: "bold", color: "#1E293B", marginBottom: 8, fontFamily: fonts.baseBold },
  card: { width: 132 },
  thumb: { width: 132, height: 176, borderRadius: 16, backgroundColor: "#1E293B" },
  play: {
    position: "absolute",
    top: 70,
    left: 48,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
  },
  playText: { color: "#FFFFFF", fontSize: 14 },
  caption: { fontSize: 11, color: "#64748B", marginTop: 6, fontWeight: "600" },
});
