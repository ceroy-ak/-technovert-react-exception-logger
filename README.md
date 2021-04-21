# React Exception Logger
***
[![npm version](https://badge.fury.io/js/%40ceroy%2Freact-exception-logger.svg)](https://badge.fury.io/js/%40ceroy%2Freact-exception-logger)

React Exception Logger, is a wrapper over the [Application Insights SDK](https://www.npmjs.com/package/@microsoft/applicationinsights-web), which takes away the need to write boiler plate codes to use the SDK.
## Installation
```sh
npm i @ceroy/react-exception-logger
```

## Implementation

### Setup

To setup the App Insight Instance for the Logger, we wrap the topmost component in the Component tree with the higher order component `withExceptionLogger()`
It takes three parameters:
- `Component : React.ComponentType<P>`     
- `connectionString : string`
- `configurations? : IConfig`

##### Example
```ts
import { withExceptionLogger, IConfig } from  '@ceroy/react-exception-logger'

const connectionString:string = "<YOUR-AZURE-APP-INSIGHTS-CONNECTION-STRING>"
const configurations:IConfig = {}

class HelloWorld extends React.Component<IHelloWorldProps, {}> {

  public render(): React.ReactElement<IHelloWorldProps> {
    return (
      <div>
        <h1> Hello World </h1>
      </div>
    );
  }
}

export default withExceptionLogger(HelloWorld,connectionString,configurations)
```
>**Note:** The connectionString is available in your Azure App Insights Dashboard
>
>**Note:** Although `configurations` is an optional parameter, but we strongly recommend to supply your custom configurations to automatically track telemetry which you are allowed for or is required

### Usage
1. **Automatic**: Thanks to the underlying [Application Insights SDK](https://www.npmjs.com/package/@microsoft/applicationinsights-web), all the telemetry are automatically tracked taking in account any `configurations` if provided. Please go through the [Configurations](https://github.com/microsoft/applicationinsights-js#configuration) for more details.
2. **Manual**: Manually as the name of the package suggests we can only log exceptions to the Azure App Insights using an exposed `logException` function.
>**Note:** Any uncaught exceptions that occur before the instance of the logger is created are put in a queue, and once the instance is created all those queue exceptions are logged into the Azure App Insights 
### Manual Usage

#### `logException()`
This is the function that is used to manually log any caught exceptions to the analytics tool. Its of type `LogExceptionFunctionType` which takes 3 parameters:
1. `error: Error`
2. `severityLevel?: SeverityLevel`
3. `properties?: any`

and returns `void`

>Note: Although `severityLevel` is an optional parameter, and by default it is `SeverityLevel.Information` enum value, but we strongly recommed to supply the severity of the case, so as to filter the same while checking out the logs in the analytics tool based on severity.

There are three ways to get hold of the `logException` function

1. **Using `props`:**

  Whichever component we wrap with our `withExceptionLogger` high order component is supplied with an additional prop `logExceptions` 

Example:
```ts
import { withExceptionLogger, IConfig, IWithExceptionLogger } from  '@ceroy/react-exception-logger'

const connectionString:string = "<YOUR-AZURE-APP-INSIGHTS-CONNECTION-STRING>"
const configurations:IConfig = {}

class HelloWorld extends React.Component<IHelloWorldProps & IWithExceptionLogger, {}> {
  public someFunction(){
	  try{
	  //Your Code
	  }catch(err){
		  this.props.logException(new Error(err))
	  }
  }
  public render(): React.ReactElement<IHelloWorldProps> {
    return (
      <div>
        <h1> Hello World </h1>
      </div>
    );
  }
}

export default withExceptionLogger(HelloWorld,connectionString,configurations)
```
 >**Note:** `IWithExceptionLogger` interface is only required for *TypeScript* projects, for javascript the function is directly available with `this.props.logException()` or `props.logException()` for Functional Components
 2.  **Using `ExceptionLoggerConsumer`:**
 
 The `logException()` is also passed as a Context for all the childrens. And hence can be used using the Consumer for the Context `ExceptionLoggerConsumer`. This can be used for any Class Based Components.
 
 3. **Using `useExceptionLogger()` hook:**
 
 For Functional Component a hook `useExceptionLogger()` is avalaible.
 The `useExceptionLogger()` returns a default function of type `LogExceptionFunctionType`
	 
Example (For any Child Component):
 ```jsx
 import { useExceptionLogger } from  '@ceroy/react-exception-logger'

function  Child() {
	const  logger = useExceptionLogger()
	return (

		<div>
			<PrimaryButton  text="Click to Log an Exception"  onClick={() => { logger(new  Error('Button Clicked'),) }}  />
		</div>
	)
}
export  default  Child
```
 
 ## Future Releases
 1. Improving the Documentation
 2. Making the package support other analytics tools like Google analytics, etc down the line.
