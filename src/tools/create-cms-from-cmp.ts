import { tool, ParameterType } from "@optimizely-opal/opal-tools-sdk";

interface ContentParameters {
  title: string;
}

async function createContent(parameters: ContentParameters) {
  const { title } = parameters;

  let content: string;
  content = "hello world" + title


const myHeaders = new Headers();
myHeaders.append("Content-Type", "application/json");

const raw = JSON.stringify({
  "grant_type": "client_credentials",
  "client_id": "64cf088b82e44b3e859fc9be19ac025f",
  "client_secret": "ozbayC0QsoAeqLYC5tfBfTsfbLHLrIGPk5SEBWaTiYLoiEHe",
  "act_as": "dan.oneil@optimizely.com"
});

const requestOptions: RequestInit = {
  method: "POST",
  headers: myHeaders,
  body: raw,
  redirect: "follow"
};

fetch("https://api.cms.optimizely.com/oauth/token", requestOptions)
  .then((response) => response.text())
  .then((result) => content = result)
  .catch((error) => console.error(error));




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