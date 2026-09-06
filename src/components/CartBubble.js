// Floating draggable cart bubble (website parity): shows item count + live
// total, drag it anywhere, tap to open the cart. Native PanResponder, no
// extra dependencies.

import React, { useEffect, useRef } from "react";
import { Animated, PanResponder, StyleSheet, Text, TouchableOpacity } from "react-native";
import { colors, fonts } from "../theme";

export default function CartBubble({ count, totalRupees, onPress }) {
  const pan = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const startPos = useRef(null);
  const moved = useRef(false);

  useEffect(() => {
    // reset drift when the cart empties so it re-anchors on next add
    if (!count) {
      pan.setValue({ x: 0, y: 0 });
      startPos.current = null;
    }
  }, [count, pan]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        moved.current = false;
        if (!startPos.current) {
          startPos.current = { x: pan.x._value, y: pan.y._value };
        }
        pan.setOffset({ x: pan.x._value, y: pan.y._value });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: (e, gestureState) => {
        if (Math.abs(gestureState.dx) > 4 || Math.abs(gestureState.dy) > 4) moved.current = true;
        Animated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false })(e, gestureState);
      },
      onPanResponderRelease: () => {
        pan.flattenOffset();
        if (!moved.current) onPress?.();
      },
    })
  ).current;

  if (!count) return null;

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={[styles.bubble, { transform: [{ translateX: pan.x }, { translateY: pan.y }] }]}
    >
      <TouchableOpacity activeOpacity={0.9} onPress={onPress} style={styles.inner}>
        <Text style={styles.count}>{count}</Text>
        <Text style={styles.total}>· ₹{Math.round(totalRupees)}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const BUBBLE_SIZE = 58;

const styles = StyleSheet.create({
  bubble: {
    position: "absolute",
    right: 18,
    bottom: 84,
    zIndex: 90,
    elevation: 90,
  },
  inner: {
    minWidth: BUBBLE_SIZE,
    height: BUBBLE_SIZE,
    borderRadius: 999,
    backgroundColor: colors.orange,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.6)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  count: { color: "#fff", fontSize: 16, fontWeight: "900", fontFamily: fonts.baseBold },
  total: { color: "rgba(255,255,255,0.9)", fontSize: 12, fontWeight: "700", marginLeft: 4, fontFamily: fonts.baseBold },
});
