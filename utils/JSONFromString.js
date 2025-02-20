exports.extractJSON = (stringedJSON) => {
  const jsonMatch = stringedJSON.match(/\{[\s\S]*\}$/); // Extracts content inside `{}` braces
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[0]); // Convert string to JSON
    } catch (error) {
      console.error("Invalid JSON format:", error.message);
      return null;
    }
  } else {
    console.error("No JSON found in the string.");
    return null;
  }
};
