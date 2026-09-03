import React from "react";
import { Modal, View, Text, Image, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import ChefVideoGallery from "./ChefVideoGallery";
import { fonts } from "../theme";

export default function ExpandedHingeProfile({ visible, kitchen, onClose, onAdd, onOpenReel, onBulk }) {
  if (!kitchen) return null;
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <ScrollView style={styles.page} contentContainerStyle={{ paddingBottom: 40 }}>
        <TouchableOpacity onPress={onClose} style={styles.closeWrap}>
          <Text style={styles.close}>✕ Close profile</Text>
        </TouchableOpacity>
        {kitchen.photos?.[0] ? <Image source={{ uri: kitchen.photos[0] }} style={styles.hero} /> : null}
        <View style={styles.body}>
          <Text style={styles.region}>{kitchen.regionalIdentity}</Text>
          <Text style={styles.title}>{kitchen.kitchenName}</Text>
          <Text style={styles.chef}>By {kitchen.chefName}  ·  ⭐ {kitchen.rating}</Text>
          <Text style={styles.fssai}>{kitchen.fssai}</Text>
          <Text style={styles.bio}>{kitchen.bio}</Text>
          <ChefVideoGallery videos={kitchen.videoGallery || []} onOpenReel={onOpenReel} />
          <TouchableOpacity style={styles.bulk} onPress={() => onBulk(kitchen.chefName)}>
            <Text style={styles.bulkText}>📦 Request bulk catering</Text>
          </TouchableOpacity>
          {(kitchen.menu || []).map((item) => (
            <View key={item.id} style={styles.dish}>
              <View style={{ flex: 1 }}>
                <Text style={styles.dishName}>{item.name}</Text>
                <Text style={styles.dishDesc}>{item.desc}</Text>
                <Text style={styles.price}>₹{item.price}</Text>
              </View>
              <TouchableOpacity style={styles.add} onPress={() => onAdd(item)}>
                <Text style={styles.addText}>+ ADD</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </ScrollView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#FBF9F6" },
  closeWrap: { paddingTop: 48, paddingHorizontal: 16, paddingBottom: 8 },
  close: { color: "#E53A00", fontWeight: "bold" },
  hero: { width: "100%", height: 240, backgroundColor: "#E2E8F0" },
  body: { padding: 18 },
  region: { fontSize: 11, fontWeight: "bold", color: "#E53A00" },
  title: { fontSize: 24, fontWeight: "bold", color: "#1E293B", marginTop: 6, fontFamily: fonts.heading },
  chef: { fontSize: 13, color: "#64748B", marginTop: 4 },
  fssai: { fontSize: 11, color: "#64748B", marginTop: 4 },
  bio: { fontSize: 14, color: "#64748B", marginTop: 12, lineHeight: 20 },
  bulk: { marginTop: 16, backgroundColor: "#1E293B", borderRadius: 14, padding: 14, alignItems: "center" },
  bulkText: { color: "#FFFFFF", fontWeight: "bold" },
  dish: { flexDirection: "row", marginTop: 10, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E2E8F0", borderRadius: 16, padding: 12 },
  dishName: { fontWeight: "bold", color: "#1E293B" },
  dishDesc: { fontSize: 11, color: "#64748B", marginTop: 2 },
  price: { color: "#E53A00", fontWeight: "bold", marginTop: 4 },
  add: { backgroundColor: "#E53A00", alignSelf: "center", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 },
  addText: { color: "#FFFFFF", fontWeight: "bold", fontSize: 11 },
});
