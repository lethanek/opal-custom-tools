import { tool, ParameterType } from "@optimizely-opal/opal-tools-sdk";

interface ContentParameters {
  title: string;
}


async function createContent(parameters: ContentParameters) {
  const { title } = parameters;

    function getCMPToken(): string {
    // fetch token from CMP API and set to
        const token = "yada yada yada";
    return token
    }
    let cmpToken = getCMPToken();

  let content: string;
  content = "hello world" + cmpToken



  return {
    content
  };
}



tool({
  name: "create_cms_from_cmp",
  description:
    "Gets content from a CMP and creates a CMS entry",
  parameters: [
    {
      name: "title",
      type: ParameterType.String,
      description: "title for the content",
      required: true,
    }
  ],
})(createContent);