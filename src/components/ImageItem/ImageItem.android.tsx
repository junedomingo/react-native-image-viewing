/**
 * Copyright (c) JOB TODAY S.A. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import React, { useState, useCallback } from "react";

import {
  Animated,
  Dimensions,
  StyleSheet,
  NativeScrollEvent,
  NativeSyntheticEvent
} from "react-native";

import useImageDimensions from "../../hooks/useImageDimensions";
import useZoomPanResponder from "../../hooks/useZoomPanResponder";

import { getImageStyles, getImageTransform } from "../../utils";
import { Dimensions, ImageSource } from "../../@types";
import { ImageLoading } from "./ImageLoading";

const SWIPE_CLOSE_OFFSET = 75;
const SWIPE_CLOSE_VELOCITY = 1.75;

type Props = {
  imageSrc: ImageSource;
  onRequestClose: () => void;
  onZoom: (isZoomed: boolean) => void;
  onLoadEnd: () => void;
  onLoadStart: () => void;
  swipeToCloseEnabled?: boolean;
  doubleTapToZoomEnabled?: boolean;
  SCREEN: Dimensions;
  onLoad: () => void;
};

const ImageItem = ({
  imageSrc,
  onLoadEnd,
  onLoadStart,
  onZoom,
  onRequestClose,
  swipeToCloseEnabled = true,
  doubleTapToZoomEnabled = true,
  SCREEN,
}: Props) => {
  const imageContainer = React.createRef();
  const imageDimensions = useImageDimensions(imageSrc);
  const [translate, scale] = getImageTransform(imageDimensions, SCREEN);
  const scrollValueY = new Animated.Value(0);
  const [isLoaded, setLoadEnd] = useState(false);

  const onLoaded = useCallback(() => setLoadEnd(true), []);
  const onZoomPerformed = (isZoomed: boolean) => {
    onZoom(isZoomed);
    if (imageContainer?.current) {
      // @ts-ignore
      imageContainer.current.setNativeProps({
        scrollEnabled: !isZoomed
      });
    }
  };

  const [panHandlers, scaleValue, translateValue] = useZoomPanResponder({
    initialScale: scale || 1,
    initialTranslate: translate || { x: 0, y: 0 },
    onZoom: onZoomPerformed,
    doubleTapToZoomEnabled,
    SCREEN,
  });

  const imagesStyles = getImageStyles(
    imageDimensions,
    translateValue,
    scaleValue
  );
  const imageOpacity = scrollValueY.interpolate({
    inputRange: [-SWIPE_CLOSE_OFFSET, 0, SWIPE_CLOSE_OFFSET],
    outputRange: [0.7, 1, 0.7]
  });
  const imageStylesWithOpacity = { ...imagesStyles, opacity: imageOpacity };

  const onScrollEndDrag = ({
    nativeEvent
  }: NativeSyntheticEvent<NativeScrollEvent>) => {
    const velocityY = nativeEvent?.velocity?.y ?? 0;
    const offsetY = nativeEvent?.contentOffset?.y ?? 0;

    if (
      Math.abs(velocityY) > SWIPE_CLOSE_VELOCITY &&
      offsetY > SWIPE_CLOSE_OFFSET
    ) {
      onRequestClose();
    }
  };

  const onScroll = ({
    nativeEvent
  }: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetY = nativeEvent?.contentOffset?.y ?? 0;

    scrollValueY.setValue(offsetY);
  };

  return (
    <Animated.ScrollView
      ref={imageContainer}
      style={styles.listItem}
      pagingEnabled
      nestedScrollEnabled
      showsHorizontalScrollIndicator={false}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.imageScrollContainer}
      scrollEnabled={swipeToCloseEnabled}
      {...(swipeToCloseEnabled && {
        onScroll,
        onScrollEndDrag
      })}
    >
      <Animated.Image
        {...panHandlers}
        source={imageSrc}
        style={imageStylesWithOpacity}
        onLoad={onLoaded}
        onLoadStart={onLoadStart}
        onLoadEnd={onLoadEnd}
      />
      {(!isLoaded || !imageDimensions) && <ImageLoading />}
    </Animated.ScrollView>
  );
};

const styles = StyleSheet.create({
  listItem: {
    width: '100%',
    height: '100%',
  },
  imageScrollContainer: {
    height: '200%',
  }
});

export default React.memo(ImageItem);
