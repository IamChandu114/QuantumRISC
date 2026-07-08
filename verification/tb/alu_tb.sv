`timescale 1ns / 1ps

module alu_tb;

logic [31:0] a;
logic [31:0] b;
logic [3:0] alu_control;

logic [31:0] result;
logic zero;

alu dut(
    .a(a),
    .b(b),
    .alu_control(alu_control),
    .result(result),
    .zero(zero)
);

initial begin

    $display("==========================");
    $display(" QuantumRISC ALU Test");
    $display("==========================");

    // ADD
    a=20; b=10; alu_control=4'b0000;
    #10;
    if(result==30) $display("[PASS] ADD");
    else $display("[FAIL] ADD");

    // SUB
    alu_control=4'b0001;
    #10;
    if(result==10) $display("[PASS] SUB");
    else $display("[FAIL] SUB");

    // AND
    a=32'hF0F0;
    b=32'h0FF0;
    alu_control=4'b0010;
    #10;
    if(result==32'h00F0) $display("[PASS] AND");
    else $display("[FAIL] AND");

    // OR
    alu_control=4'b0011;
    #10;
    if(result==32'hFFF0) $display("[PASS] OR");
    else $display("[FAIL] OR");

    // XOR
    alu_control=4'b0100;
    #10;
    if(result==32'hFF00) $display("[PASS] XOR");
    else $display("[FAIL] XOR");

    // SLT
    a=5;
    b=10;
    alu_control=4'b0111;
    #10;
    if(result==1) $display("[PASS] SLT");
    else $display("[FAIL] SLT");

    $display("==========================");
    $display(" ALU Test Completed");
    $display("==========================");

    $finish;

end

endmodule