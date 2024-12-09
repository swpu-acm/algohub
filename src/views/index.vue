<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

const loading = ref(true);
</script>

<template>
  <SplashScreen v-if="loading" v-model="loading" />
  <div v-if="!loading"
    class="fixed bottom-0 sm:bottom-unset w-full py-2 bg-indigo-600 text-white sm:flex sm:items-center sm:justify-between sm:px-6 lg:px-8">
    <p class="text-center font-medium sm:text-left">
      AlgoHub is on alpha now! Want to try it out?
      <br class="sm:hidden" />
      See the latest updates!
    </p>

    <a class="mt-4 block rounded-lg bg-white px-5 py-3 text-center text-sm font-medium text-indigo-600 transition hover:bg-white/90 focus:outline-none focus:ring active:text-indigo-500 sm:mt-0"
      href="https://github.com/swpu-acm/algohub/releases">
      Releases
    </a>
  </div>
  <section v-if="!loading" class="bg-gray-900 text-white h-screen w-full">
    <div class="mx-auto max-w-screen-xl px-4 py-32 lg:flex lg:h-screen lg:items-center">
      <div class="mx-auto max-w-3xl text-center">
        <h1
          class="bg-gradient-to-r from-green-300 via-blue-500 to-purple-600 bg-clip-text text-3xl font-extrabold text-transparent sm:text-5xl">
          Learn and study algorithms

          <span class="sm:block"> on a single collaborative platform. </span>
        </h1>

        <p class="mx-auto mt-4 max-w-xl sm:text-xl/relaxed">
          Powered by Association of Computing Machinery affiliated Southwest Petroleum University
        </p>

        <div class="mt-8 flex flex-wrap justify-center gap-4">
          <a class="block w-full rounded border border-blue-600 bg-blue-600 px-12 py-3 text-sm font-medium text-white hover:bg-transparent hover:text-white focus:outline-none focus:ring active:text-opacity-75 sm:w-auto cursor-pointer"
            @click="router.push('/signup')">
            Signup
          </a>

          <a class="block w-full rounded border border-blue-600 px-12 py-3 text-sm font-medium text-white hover:bg-blue-600 focus:outline-none focus:ring active:bg-blue-500 sm:w-auto cursor-pointer"
            @click="router.push('/login')">
            Login
          </a>
        </div>
      </div>
    </div>
  </section>
</template>
