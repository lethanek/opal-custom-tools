import { tool, ParameterType } from "@optimizely-opal/opal-tools-sdk";

interface ContentParameters {
  title: string;
}


async function createContent(parameters: ContentParameters) {
  const { title } = parameters;

    let cmpToken = null;
    async function getCMPToken(){

       const response = await fetch("https://accounts.cmp.optimizely.com/o/oauth2/v1/token", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                    "client_id": "c3299596-7176-4360-84a3-c8871bd85f7b",
                "client_secret": "67600fb515df373c1e195826a94ee9303d78a178f8b78363125ee1d143586c02",
                "grant_type": "client_credentials"
            })
        });

        const data = await response.json();
        
        if (data.access_token) {
            cmpToken = data.access_token;
            return data.access_token;
        } else {
            throw new Error("No access token received");
        }
    }
    
    await getCMPToken();

  let content: string;
  content = "cmp token = " + cmpToken



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