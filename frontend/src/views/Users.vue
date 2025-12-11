<template>
  <CrudTable
    title="Usuários"
    subtitle="Gerencie os usuários do sistema"
    :columns="columns"
    :items="users"
    v-model:search="search"
    @new="openModal()"
    @edit="openModal"
    @delete="deleteUser"
  >
    <template #cell-role="{ item }">
      <span :class="[
        'px-2 py-1 rounded-full text-xs font-medium',
        item.role === 'admin' ? 'bg-error bg-opacity-20 text-error' :
        item.role === 'supervisor' ? 'bg-warning bg-opacity-20 text-warning' :
        'bg-success bg-opacity-20 text-success'
      ]">
        {{ roleLabels[item.role] }}
      </span>
    </template>

    <template #cell-line="{ item }">
      <span v-if="item.line" class="text-sm">
        {{ getLineName(item.line) }}
      </span>
      <span v-else class="text-gray-400 text-sm italic">Nenhuma</span>
    </template>

    <template #cell-status="{ item }">
      <span :class="[
        'px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1 w-fit',
        item.status === 'Online' ? 'bg-success bg-opacity-20 text-success' : 'bg-gray-200 text-gray-600'
      ]">
        <span :class="['w-2 h-2 rounded-full', item.status === 'Online' ? 'bg-success' : 'bg-gray-600']"></span>
        <span>{{ item.status }}</span>
      </span>
    </template>
  </CrudTable>

  <!-- Modal -->
  <div v-if="showModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-2xl p-6 w-full max-w-md">
      <h3 class="text-xl font-bold mb-4">{{ editingItem ? 'Editar' : 'Novo' }} Usuário</h3>
      <form @submit.prevent="saveUser" class="space-y-4">
        <div>
          <label class="block text-sm font-medium mb-2">Nome</label>
          <input v-model="form.name" type="text" required class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary" />
        </div>
        <div>
          <label class="block text-sm font-medium mb-2">Email</label>
          <input v-model="form.email" type="email" required class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary" />
        </div>
        <div v-if="!editingItem">
          <label class="block text-sm font-medium mb-2">Senha</label>
          <input v-model="form.password" type="password" :required="!editingItem" class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary" />
        </div>
        <div>
          <label class="block text-sm font-medium mb-2">Role</label>
          <select v-model="form.role" required class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary">
            <option value="admin">Admin</option>
            <option value="supervisor">Supervisor</option>
            <option value="operator">Operador</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium mb-2">Linha WhatsApp</label>
          <select v-model="form.line" class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary">
            <option :value="null">Nenhuma</option>
            <option v-for="line in lines" :key="line.id" :value="line.id">
              {{ line.phone }} - {{ line.evolutionName }}
            </option>
          </select>
          <p class="text-xs text-gray-500 mt-1">Linha que será usada para enviar mensagens</p>
        </div>
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

const users = ref([])
const lines = ref([])
const search = ref('')
const showModal = ref(false)
const editingItem = ref(null)
const form = ref({ name: '', email: '', password: '', role: 'operator', line: null })

const columns = [
  { key: 'name', label: 'Nome' },
  { key: 'email', label: 'Email' },
  { key: 'role', label: 'Role' },
  { key: 'line', label: 'Linha' },
  { key: 'status', label: 'Status' },
]

const roleLabels = {
  admin: 'Admin',
  supervisor: 'Supervisor',
  operator: 'Operador',
}

onMounted(async () => {
  await loadUsers()
  await loadLines()
})

watch(search, () => loadUsers())

const loadUsers = async () => {
  const response = await api.get('/users', { params: { search: search.value } })
  users.value = response.data
}

const loadLines = async () => {
  const response = await api.get('/lines')
  lines.value = response.data
}

const getLineName = (lineId) => {
  const line = lines.value.find(l => l.id === lineId)
  return line ? line.phone : 'N/A'
}

const openModal = (item = null) => {
  editingItem.value = item
  if (item) {
    form.value = { ...item, password: '' }
  } else {
    form.value = { name: '', email: '', password: '', role: 'operator', line: null }
  }
  showModal.value = true
}

const saveUser = async () => {
  try {
    if (editingItem.value) {
      await api.patch(`/users/${editingItem.value.id}`, form.value)
    } else {
      await api.post('/users', form.value)
    }
    showModal.value = false
    loadUsers()
  } catch (error) {
    alert('Erro ao salvar usuário')
  }
}

const deleteUser = async (item) => {
  if (confirm('Deseja realmente excluir este usuário?')) {
    await api.delete(`/users/${item.id}`)
    loadUsers()
  }
}
</script>
