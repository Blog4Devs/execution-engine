import { Box, Button, Text, useToast } from "@chakra-ui/react";
import { executeCode } from "../api";
import { useState } from "react";
const Output = ({ editorRef, language }) => {
  const toast = useToast();
  const [output, setoutput] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [errorio, setErrorio] = useState("");
  const runCode = async () => {
    const sourceCode = editorRef.current.getValue();
    if (!sourceCode) return;

    try {
      setIsLoading(true);
      setErrorio(null);
      setoutput(null);
      const { output } = await executeCode(language, sourceCode);
      console.log(output);
      output ? setIsError(true) : setIsError(false);
      setoutput(output);
    } catch (error) {
      setErrorio(error.message);

      /*     toast({
        title: "An error occurred.",
        description: error.message || "Unable to run code",
        status: "error",
        duration: 6000,
      });*/
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box w="50%">
      <Text fontSize="lg">Output</Text>
      <Button
        isLoading={isLoading}
        onClick={runCode}
        variant="outline"
        colorScheme="green"
        mb={2}
      >
        Run code
      </Button>
     
      <Box height="75vh" p={2}  border="1px solid" borderColor={errorio ? "red.500" : "gray.200"}   borderRadius={4}>
      
        {!output && !errorio ? 'Click "Run Code" to see the output here' : null}

        {output && <Text>{output}</Text>}
        {errorio ? (
          <Text color="red.500" mt={2}>
            {errorio}
          </Text>
        ) : (
          ""
        )}
      </Box>
    </Box>
  );
};
export default Output;
