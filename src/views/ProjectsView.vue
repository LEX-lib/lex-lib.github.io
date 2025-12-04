<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <h2>Project Directory</h2>
  <p>Welcome to the project directory. Here you can find various projects and their details.</p>
  <nav>
    <ul>
      <li>
        <RouterLink to="/projects/larga">Larga</RouterLink>
      </li>
      <li>
        <RouterLink to="/projects/lextrack">LexTrack</RouterLink>
      </li>
      <li>
        <RouterLink to="/projects/gift-exchange/join">Pista ng Pasko (Gift Exchange)</RouterLink>
      </li>
<!--      <li>-->
<!--        <RouterLink to="/projects/another-project">Another Project</RouterLink>-->
<!--      </li>-->
    </ul>
  </nav>
</template>

<style scoped>

</style>