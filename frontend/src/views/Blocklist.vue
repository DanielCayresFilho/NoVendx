<template>
  <CrudTable
    title="Blocklist"
    subtitle="Gerencie a lista de bloqueio"
    :columns="columns"
    :items="blocklist"
    v-model:search="search"
    @new="openModal()"
    @edit="openModal"
    @delete="deleteBlocklist"
  />

  <div v-if="showModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-2xl p-6 w-full max-w-md">
      <h3 class="text-xl font-bold mb-4">{{ editingItem ? 'Editar' : 'Novo' }} Bloqueio</h3>
      <form @submit.prevent="saveBlocklist" class="space-y-4">
        <div>
          <label class="block text-sm font-medium mb-2">Nome (opcional)</label>
          <input v-model="form.name" type="text" class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary" />
        </div>
        <div>
          <label class="block text-sm font-medium mb-2">Telefone (opcional)</label>
          <input v-model="form.phone" type="text" class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary" />
        </div>
        <div>
          <label class="block text-sm font-medium mb-2">CPF (opcional)</label>
          <input v-model="form.cpf" type="text" class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary" />
        </div>
        <p class="text-xs text-textSecondary">Preencha pelo menos um campo</p>
        <div class="flex space-x-3">
          <button type="button" @click="showModal = false" class="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50">Cancelar</button>
          <button type="submit" class="flex-1 bg-primary text-white px-4 py-2 rounded-lg hover:bg-secondary">Salvar</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import CrudTable from '../components/common/CrudTable.vue'
import api from '../services/api'

const blocklist = ref([])
const search = ref('')
const showModal = ref(false)
const editingItem = ref(null)
const form = ref({ name: '', phone: '', cpf: '' })

const columns = [
  { key: 'name', label: 'Nome' },
  { key: 'phone', label: 'Telefone' },
  { key: 'cpf', label: 'CPF' },
]

onMounted(() => loadBlocklist())
watch(search, () => loadBlocklist())

const loadBlocklist = async () => {
  const response = await api.get('/blocklist', { params: { search: search.value } })
  blocklist.value = response.data
}

const openModal = (item = null) => {
  editingItem.value = item
  form.value = item ? { ...item } : { name: '', phone: '', cpf: '' }
  showModal.value = true
}

const saveBlocklist = async () => {
  if (!form.value.name && !form.value.phone && !form.value.cpf) {
    alert('Preencha pelo menos um campo')
    return
  }

  try {
    if (editingItem.value) {
      await api.patch(`/blocklist/${editingItem.value.id}`, form.value)
    } else {
      await api.post('/blocklist', form.value)
    }
    showModal.value = false
    loadBlocklist()
  } catch (error) {
    alert('Erro ao salvar bloqueio')
  }
}

const deleteBlocklist = async (item) => {
  if (confirm('Deseja realmente excluir este bloqueio?')) {
    await api.delete(`/blocklist/${item.id}`)
    loadBlocklist()
  }
}
</script>
