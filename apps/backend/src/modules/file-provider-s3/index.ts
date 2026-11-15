import { ModuleProvider, Modules } from "@medusajs/framework/utils"
import OptimizedS3FileService from "./service"

export default ModuleProvider(Modules.FILE, {
  services: [OptimizedS3FileService],
})
