<template>
  <router-view />
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { supabase } from '@/utils/supabase.js'

const session = ref()

onMounted(() => {
  supabase.auth.getSession().then(({ data }) => {
    session.value = data.session
  })

  supabase.auth.onAuthStateChange((_, _session) => {
    session.value = _session
  })
})
</script>
