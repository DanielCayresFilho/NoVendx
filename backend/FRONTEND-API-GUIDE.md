# Guia de API para o Frontend

## 🔌 Criar Linha (POST /lines)

### Autenticação
**Header:** `Authorization: Bearer <token>`

**Role necessária:** `admin`

### Estrutura de Dados

#### Campos Obrigatórios
```json
{
  "phone": "5511999999999",
  "evolutionName": "Evolution01"
}
```

#### Campos Opcionais
```json
{
  "segment": 1,
  "oficial": false,
  "lineStatus": "active",
  "linkedTo": null,
  "token": null,
  "businessID": null,
  "numberId": null
}
```

### Exemplo Completo
```json
{
  "phone": "5511999999999",
  "evolutionName": "Evolution01",
  "segment": 1,
  "oficial": false
}
```

### Validações

- **phone**: String, obrigatório, único
- **evolutionName**: String, obrigatório, deve existir no banco
- **segment**: Número (converter de string se necessário)
- **oficial**: Boolean (converter de string se necessário)
- **lineStatus**: Enum ["active", "ban"]
- **linkedTo**: Número (ID do usuário)

### Resposta de Sucesso (201)
```json
{
  "id": 1,
  "phone": "5511999999999",
  "evolutionName": "Evolution01",
  "lineStatus": "active",
  "segment": 1,
  "linkedTo": null,
  "oficial": false,
  "token": null,
  "businessID": null,
  "numberId": null,
  "createdAt": "2025-12-11T10:00:00.000Z",
  "updatedAt": "2025-12-11T10:00:00.000Z"
}
```

### Possíveis Erros

#### 400 - Bad Request
```json
{
  "statusCode": 400,
  "message": [
    "phone should not be empty",
    "phone must be a string",
    "evolutionName should not be empty",
    "evolutionName must be a string"
  ],
  "error": "Bad Request"
}
```

**Causa:** Dados inválidos ou faltando campos obrigatórios

#### 400 - Telefone Duplicado
```json
{
  "statusCode": 400,
  "message": "Já existe uma linha com este telefone",
  "error": "Bad Request"
}
```

#### 404 - Evolution Não Encontrada
```json
{
  "statusCode": 404,
  "message": "Evolution não encontrada",
  "error": "Not Found"
}
```

#### 400 - Erro na Evolution API
```json
{
  "statusCode": 400,
  "message": "Erro na Evolution API: Invalid integration",
  "error": "Bad Request"
}
```

---

## 📋 Listar Evolutions (GET /lines/evolutions)

### Resposta
```json
[
  {
    "id": 1,
    "evolutionName": "Evolution01",
    "evolutionUrl": "http://localhost:8080",
    "evolutionKey": "sua-chave",
    "createdAt": "2025-12-11T10:00:00.000Z",
    "updatedAt": "2025-12-11T10:00:00.000Z"
  }
]
```

---

## 📱 Obter QR Code (GET /lines/:id/qrcode)

### Resposta
```json
{
  "qrcode": {
    "base64": "data:image/png;base64,iVBORw0KGgoAAAANS...",
    "code": "1@abc123..."
  }
}
```

---

## 🔍 Ver Schema Esperado (GET /lines/schema)

Endpoint útil para desenvolvedores verem a estrutura esperada.

---

## ⚠️ Checklist para o Frontend

### Ao enviar dados para criar linha:

1. ✅ Certifique-se de que `phone` é uma **string** (não número)
2. ✅ Certifique-se de que `evolutionName` está preenchido
3. ✅ Se enviar `segment`, converta para **número** (não string)
4. ✅ Se enviar `oficial`, converta para **boolean** (não string "true"/"false")
5. ✅ Não envie campos vazios como `""` - envie `null` ou não envie
6. ✅ Remova campos que não estão no DTO

### Exemplo de código Vue.js correto:

```javascript
const saveLine = async () => {
  try {
    const payload = {
      phone: formData.phone, // string
      evolutionName: formData.evolutionName, // string
    };

    // Adicionar opcionais apenas se tiverem valor
    if (formData.segment) {
      payload.segment = parseInt(formData.segment); // converter para número
    }
    
    if (formData.oficial !== undefined) {
      payload.oficial = Boolean(formData.oficial); // converter para boolean
    }

    const response = await axios.post('/lines', payload);
    console.log('Linha criada:', response.data);
  } catch (error) {
    console.error('Erro:', error.response?.data);
  }
};
```

### Carregar Evolutions no Select:

```javascript
const loadEvolutions = async () => {
  try {
    const response = await axios.get('/lines/evolutions');
    evolutions.value = response.data;
  } catch (error) {
    console.error('Erro ao carregar evolutions:', error);
  }
};
```

