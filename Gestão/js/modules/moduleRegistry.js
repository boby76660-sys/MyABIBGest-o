/**
 * Module Registry - Arquitetura de Módulos Plug & Play
 * 
 * GUIA PARA FUTURAS IAs E DESENVOLVEDORES:
 * Para adicionar um novo módulo no sistema (ex: Inventário, Preços, Compras):
 * 1. Crie a pasta do módulo em `js/modules/nomeDoModulo/`
 * 2. Crie uma classe estendendo `BaseModule` implementando render() e destroy().
 * 3. Registre a instância do módulo no `ModuleRegistry.register(instancia)`.
 * 4. Adicione a chave do módulo no array `MODULOS_SEED` em `js/config.js`.
 */

export class BaseModule {
  constructor(id, name, icon, description) {
    this.id = id;
    this.name = name;
    this.icon = icon;
    this.description = description;
  }

  async render(containerElement, currentProfile) {
    throw new Error(`Método render() deve ser implementado no módulo ${this.id}`);
  }

  async destroy() {
    // Limpeza de event listeners se necessário
  }
}

class Registry {
  constructor() {
    this.modules = new Map();
  }

  register(moduleInstance) {
    if (!(moduleInstance instanceof BaseModule)) {
      throw new Error("Instância de módulo inválida. Deve estender BaseModule.");
    }
    this.modules.set(moduleInstance.id, moduleInstance);
    console.log(`📦 Módulo '${moduleInstance.name}' (${moduleInstance.id}) registrado.`);
  }

  get(id) {
    return this.modules.get(id);
  }

  getAll() {
    return Array.from(this.modules.values());
  }
}

export const ModuleRegistry = new Registry();
