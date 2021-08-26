<template>
  <div class="route__tag" :class="`route__tag-${tag}`">
    <span class="route__tag-text">{{ routeTagText }}</span>
  </div>
</template>

<script>
export default {
  name: 'RouteTag',
  props: {
    tag: String,
  },
  data() {
    return {
      tags: {
        fast: '早',
        conv: '楽',
        cheap: '安',
      },
    };
  },
  computed: {
    routeTagText() {
      return this.tags[this.tag];
    },
  },
};
</script>
