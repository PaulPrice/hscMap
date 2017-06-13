<template lang="pug">
xMenuBarItem(label="Frame")
    xMenuItem(label="New Frame", @click="$root.s.frameManager.newFrame()", accessKey="alt+N")
    xMenuItem(label="Delete Frame", @click="$root.s.frameManager.deleteCurrentFrame()", :disabled="$root.s.frameManager.framePanels.length <= 1")
    xDivider
    xMenuItem(label="Single", :checked="$root.s.frameManager.mode == 'single'", @click="$root.s.frameManager.mode = 'single'")
    xMenuItem(label="Window", :checked="$root.s.frameManager.mode == 'panel'", @click="$root.s.frameManager.mode = 'panel'")
    xDivider
    xMenuItem(
        v-for="fp in $root.s.frameManager.framePanels", :key="fp",
        :label="fp.frame.name",
        :checked="$root.s.frameManager.currentFrame == fp.frame",
        @click="$root.s.frameManager.currentFrame = fp.frame",
    )
</template>