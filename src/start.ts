import { startServer } from "./server/index.ts";
import { saveDesign } from "./server/store.ts";
import { exampleDesign } from "./schema/example.ts";

// Si no hay diseños, sembramos el ejemplo para que el servidor sea usable ya.
import { listDesigns } from "./server/store.ts";
if (listDesigns().length === 0) {
  saveDesign("salon", exampleDesign);
  console.log("Sembrado diseño de ejemplo: 'salon'");
}

startServer();
