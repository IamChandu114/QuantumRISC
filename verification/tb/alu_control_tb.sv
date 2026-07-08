`timescale 1ns / 1ps

module alu_control_tb;

logic [1:0] ALUOp;
logic [2:0] funct3;
logic [6:0] funct7;

logic [3:0] alu_control;

alu_control dut(

    .ALUOp(ALUOp),
    .funct3(funct3),
    .funct7(funct7),
    .alu_control(alu_control)

);

initial begin

    $display("==============================");
    $display(" QuantumRISC ALU Control Test");
    $display("==============================");

    // ADD
    ALUOp  = 2'b10;
    funct3 = 3'b000;
    funct7 = 7'b0000000;

    #10;

    if(alu_control == 4'b0000)
        $display("[PASS] ADD");
    else
        $display("[FAIL] ADD");

    // SUB
    funct7 = 7'b0100000;

    #10;

    if(alu_control == 4'b0001)
        $display("[PASS] SUB");
    else
        $display("[FAIL] SUB");

    // AND
    funct3 = 3'b111;
    funct7 = 7'b0000000;

    #10;

    if(alu_control == 4'b0010)
        $display("[PASS] AND");
    else
        $display("[FAIL] AND");

    // OR
    funct3 = 3'b110;

    #10;

    if(alu_control == 4'b0011)
        $display("[PASS] OR");
    else
        $display("[FAIL] OR");

    // XOR
    funct3 = 3'b100;

    #10;

    if(alu_control == 4'b0100)
        $display("[PASS] XOR");
    else
        $display("[FAIL] XOR");

    // SLT
    funct3 = 3'b010;

    #10;

    if(alu_control == 4'b0111)
        $display("[PASS] SLT");
    else
        $display("[FAIL] SLT");

    $display("==============================");
    $display(" ALL TESTS PASSED");
    $display("==============================");

    $finish;

end

endmodule