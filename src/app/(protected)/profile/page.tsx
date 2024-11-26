import { auth } from "auth";

const SettingsPage = async() => {
  
  const session = await auth();
  
  return (
    <div className="h-screen flex justify-center items-center">
      <p>Hello, World!</p>
      <p>{JSON.stringify(session)}</p>
    </div>
  );
};

export default SettingsPage