import { Box, HStack } from "@chakra-ui/react";
import { Editor } from "@monaco-editor/react";
import { useRef, useState } from "react";
import LanguageSelector from "./LanguageSelector";
import Output from "./output";
import { CODE_SNIPPETS } from "../constants";
const CodeEditor = () => {
  const editorRef = useRef(null);
  const [value, setValue] = useState("");
  const onMount = (editor) => {
    editorRef.current = editor;
    editor.focus();
  };
  const onselect = (language) => {
    setLanguage(language);
    setValue(CODE_SNIPPETS[language]);
  };
  const [language, setLanguage] = useState("javascript");
  return (
    <Box>
      <HStack spacing={4}>
        <Box w="50%">
          <LanguageSelector 
            language={language}
            onselect={onselect}
          ></LanguageSelector>
          <Editor mb={2}
            height="75vh"
            theme="vs-dark"
            language={language}
            defaultValue={CODE_SNIPPETS[language]}
            value={value}
            onMount={onMount}
            onChange={(value) => setValue(value)}
          />
           </Box>
        <Output editorRef={editorRef} language={language}></Output>
      </HStack>
    </Box>
  );
};
export default CodeEditor;
