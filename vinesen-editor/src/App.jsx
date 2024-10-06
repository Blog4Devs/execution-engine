import { Box } from "@chakra-ui/react";
import CodeEditor from "./components/CodeEdito";

function App() {
  return (
    <Box minH="100vh" bg="#0fa19" color="gray.500" px={6} py={8}>
      <CodeEditor />
    </Box>
  );
}

export default App;
