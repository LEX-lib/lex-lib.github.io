<script setup lang="ts">
import {computed, ref} from "vue";
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const auth = useAuthStore();

const items = ref([
  {
    label: 'Home',
    icon: 'mdi:home',
    command: () => router.push('/')
  },
  {
    label: 'Projects',
    icon: 'mdi:file-document-box',
    //command: () => router.push('/projects'),
    items : [
      // {
      //   label: 'Larga',
      //   icon: 'mdi:bus-marker',
      //   command: () => router.push('/projects/larga')
      // },
      // {
      //   label: 'LexTrack',
      //   icon: 'mdi:notebook-edit-outline',
      //   command: () => router.push('/projects/lextrack')
      // },
      {
        label: 'MonitoX',
        icon: 'mdi:gift-open-outline',
        command: () => router.push('/projects/gift-exchange/join')
      }
    ]
  },
  {
    label: 'Blogs',
    icon: 'mdi:blog-outline',
    command: () => router.push('/blog')
  },
]);

const logOut = () => {
  auth.logout();
  router.push('/');
}

const avatarImage = computed(() => {
  return "https://api.dicebear.com/9.x/identicon/svg?seed=" + encodeURIComponent(auth.user?.name) || "guest";
});

const menu = ref();
const profileItems = ref([
  {
    label: 'Profile',
    items: [
      // {
      //   label: 'Settings',
      //   icon: 'pi pi-cog',
      //   shortcut: '⌘+O'
      // },
      // {
      //   label: 'Messages',
      //   icon: 'pi pi-inbox',
      //   badge: 2
      // },
      {
        label: 'Logout',
        icon: 'pi pi-sign-out',
        shortcut: '⌘+Q',
        command: () => logOut()
      }
    ]
  }]
);
const toggle = (event: any) => {
  menu.value.toggle(event);
};
</script>

<template>
  <Menubar :model="items">
    <template #start>
      <Button variant="link">
        <Avatar image="/branding_logo.svg" @click="router.push('/')"/>
      </Button>

<!--      <img src="@/assets/branding_logo.svg" alt="Logo" class="logo" />-->
    </template>

    <template #itemicon="{ item }">
      <iconify-icon :icon="item.icon" width="24" height="24"></iconify-icon>
    </template>

    <template #end>
      <div class="flex items-center gap-2">
        <Button @click="router.push('/login')" v-if="!auth.isLoggedIn">
          Log In
        </Button>

        <Button variant="text" v-else type="button" @click="toggle" aria-haspopup="true" aria-controls="overlay_menu">
          <Avatar :image="avatarImage" shape="circle" />
        </Button>
        <Menu ref="menu" id="overlay_menu" :model="profileItems" :popup="true">
          <!-- <template #submenulabel="{ item }">
            <span class="font-bold">{{ item.label }}</span>
          </template> -->

          <template #item="{ item, props }">
            <a v-ripple class="flex items-center" v-bind="props.action" @click="(e) => item.command && item.command({ originalEvent: e, item })">
              <span :class="item.icon" />
              <span>{{ item.label }}</span>
              <span v-if="item.shortcut"
                    class="ml-auto border border-surface rounded bg-emphasis text-muted-color text-xs p-1">
                {{ item.shortcut }}
              </span>
            </a>
          </template>
        </Menu>
      </div>
    </template>
  </Menubar>

<!--  <iconify-icon icon="mdi:home" width="24" height="24"></iconify-icon>-->
</template>

<style scoped>
.logo {
  width: 40px;
  height: 40px;
}
</style>