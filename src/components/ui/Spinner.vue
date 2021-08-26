<template>
  <div style=" height: 24px; width: 24px;">
    <div class="spinner" />
  </div>
</template>

<style>
.spinner {
  position: relative;
  top: 2px;
  left: 2px;
  height: 20px;
  width: 20px;
  /*background: rgba(0, 0, 0, .2);*/
  background: transparent;
  border-radius: 50%;
  border: 2px solid rgba(0, 0, 0, 0.4);
  border-top-color: #fff;
  animation: spinner 600ms linear infinite;
}
@keyframes spinner {
  to {
    transform: rotate(360deg);
  }
}
</style>

<script>
export default {
  name: 'Spinner',
};
</script>
