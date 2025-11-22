import { tool, ParameterType } from "@optimizely-opal/opal-tools-sdk";

interface ContentParameters {
  title: string;
}


async function createContent(parameters: ContentParameters) {
  const { title } = parameters;

    async function getCMPToken(){
        let token = null;

        try {
            const response = await fetch("https://accounts.cmp.optimizely.com/o/oauth2/v1/token", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                     "client_id": "306dd5df-dbee-4fc1-9ad8-5f8a43f4ddba",
                    "client_secret": "4b50020271b2b34bd18e2757f8f1ea37afa03244fd579de4064355d29eb6fb10",
                    "grant_type": "client_credentials"
                })
            });

            if (!response.ok) {
                throw new Error(`Token request failed with status: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.access_token) {
                token = data.access_token;
                return token
            } else {
                throw new Error("No access token received");
            }
        } catch (error) {
            console.error("Error fetching token:", error);
        }

        
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