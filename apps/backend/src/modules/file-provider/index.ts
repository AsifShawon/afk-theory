import { ModuleProvider, Modules } from "@medusajs/framework/utils"
import OptimizedLocalFileService from "./service"

export default ModuleProvider(Modules.FILE, {
  services: [OptimizedLocalFileService],
})
