import axios from "axios";

export const postMessage = async (prompt) => {
    try {
        const response = await axios.post(
            "http://localhost:3000/api/v1/messages",
            {
                message: prompt
            },
            {
                headers: {
                    "Content-Type": "application/json",
                },
            }
        );
        const answer = response.data;
        return answer;
    } catch (error) {
        console.error(
            "❌ Error calling API:",
            error.response ? error.response.data : error.message
        );
    }
};
