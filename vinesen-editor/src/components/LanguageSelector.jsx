import { Box, Text } from "@chakra-ui/react";
import {
  Menu,
  Button,
  MenuButton,
  MenuList,
  MenuItem,
  MenuItemOption,
  MenuGroup,
  MenuOptionGroup,
  MenuDivider,
} from "@chakra-ui/react";
import { LANGUAGE_VERSIONS } from "../constants";
const languages = Object.entries(LANGUAGE_VERSIONS);
const LanguageSelector = ({ language, onselect }) => {
  return (
    <Box mb={2} ml={2} fontSize="lg">
      <Text>Language:</Text>
      <Menu isLazy>
        <MenuButton as={Button}>{language}</MenuButton>
        <MenuList bg="#110c1b">
          {languages.map(([lang, version]) => (
            <MenuItem
              color={lang === language ? "blue.400" : ""}
              bg={lang === language ? "gray.900" : "transparent"}
              _hover={{
                color: "blue.400",
                bg: "gray.900",
              }}
              onClick={() => onselect(lang)}
              key={lang}
            >
              {lang}
              &nbsp;
              <Text as="span" color="gray.600" fontSize="sm">
                {version}
              </Text>
            </MenuItem>
          ))}
        </MenuList>
      </Menu>
    </Box>
  );
};
export default LanguageSelector;
