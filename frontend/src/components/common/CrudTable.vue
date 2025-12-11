<template>
  <Layout>
    <div class="flex-1 flex flex-col overflow-hidden">
      <!-- Header -->
      <div class="bg-white border-b border-borderColor px-6 py-4">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-2xl font-bold">{{ title }}</h2>
            <p class="text-textSecondary">{{ subtitle }}</p>
          </div>
          <button
            @click="$emit('new')"
            class="bg-primary text-white px-4 py-2 rounded-lg hover:bg-secondary transition-colors flex items-center space-x-2"
          >
            <i class="fas fa-plus"></i>
            <span>Novo</span>
          </button>
        </div>
      </div>

      <!-- Filtro -->
      <div class="bg-white px-6 py-4 border-b border-borderColor">
        <div class="relative">
          <i class="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
          <input
            :value="search"
            @input="$emit('update:search', $event.target.value)"
            type="text"
            placeholder="Buscar..."
            class="w-full pl-10 pr-4 py-2 border border-borderColor rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      <!-- Tabela -->
      <div class="flex-1 overflow-auto p-6">
        <div class="bg-white rounded-lg shadow-sm overflow-hidden">
          <table class="w-full">
            <thead class="bg-gray-50 border-b border-borderColor">
              <tr>
                <th
                  v-for="column in columns"
                  :key="column.key"
                  class="px-6 py-3 text-left text-xs font-medium text-textSecondary uppercase tracking-wider"
                >
                  {{ column.label }}
                </th>
                <th class="px-6 py-3 text-right text-xs font-medium text-textSecondary uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-borderColor">
              <tr v-for="item in items" :key="item.id" class="hover:bg-gray-50">
                <td
                  v-for="column in columns"
                  :key="column.key"
                  class="px-6 py-4 whitespace-nowrap text-sm text-textPrimary"
                >
                  <slot :name="`cell-${column.key}`" :item="item">
                    {{ item[column.key] }}
                  </slot>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                  <button
                    @click="$emit('edit', item)"
                    class="text-primary hover:text-secondary"
                  >
                    <i class="fas fa-edit"></i>
                  </button>
                  <button
                    @click="$emit('delete', item)"
                    class="text-error hover:text-red-700"
                  >
                    <i class="fas fa-trash"></i>
                  </button>
                </td>
              </tr>

              <tr v-if="items.length === 0">
                <td :colspan="columns.length + 1" class="px-6 py-8 text-center text-textSecondary">
                  <i class="fas fa-inbox text-4xl mb-2 opacity-30"></i>
                  <p>Nenhum registro encontrado</p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </Layout>
</template>

<script setup>
import Layout from '../layout/Layout.vue'

defineProps({
  title: String,
  subtitle: String,
  columns: Array,
  items: Array,
  search: String,
})

defineEmits(['new', 'edit', 'delete', 'update:search'])
</script>
