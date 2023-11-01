# Typescript Type Theory - Pedagogic Code
Code for the video series TypeScript Type Theory

## Episode 1 - Lambda Calculus [video](https://youtu.be/cltjpCLZZj4)
 - This has runtime code to generate and print lambda expressions
 - Lambda substitution (beta-reduction) is not implemented here

## Episode 2 - Simple Type Theory  [video](https://youtu.be/tfoBBQ8vcac)
- Implements simple type theory as a sub-set of TypeScript types
- Compile time type checking only, no need to run the code.

## Episode 3 - Propistional Logic
- Uses TypeScript types to implement logic with the Fregean truth-values approach (i.e., propositions as Booleans)
- Compile time type checking only, no need to run the code.

## Episode 4 - Propositions as Simple Types
- Uses simple types with Curry-Howard isomorphism to express propositional logic
- Work in progress

## TBD
- All folders marked TBD are works in progress that may or may not make it into the series in the future.

# How to use


## To Run a Single Episode:

`npm i` to install packages

`npm run e01` e.g., to run Episode 1.

- Many episodes are types only. You can just open them in VSCode or any text editor with inline TypeScript support.

## For Development

Open two terminals sidebar side.

In one run `npm run build -- e01` e.g., to build episode 1

Then in the other run `npm run start`

